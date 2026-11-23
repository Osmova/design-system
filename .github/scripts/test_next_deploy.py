"""Stdlib regression fixtures for the /next/ preview artifact and forced-command boundary."""
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile
import unittest
from unittest.mock import patch


def load(name):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(name + ".py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


receiver = load("receive-next")
assembler = load("assemble-next")
SHA = "a" * 40
RUN = "123"
COMMAND = "deploy-next " + SHA + " " + RUN


def fixture(sha=SHA, run_id=RUN, repository=receiver.REPOSITORY):
    files = {name: b"<!doctype html><html>fixture</html>" for name in receiver.REQUIRED}
    files.update({"assets/new-abc123.js": b"gallery", "storybook/assets/manager.js": b"catalog"})
    files["release.json"] = json.dumps({"sha": sha, "run_id": run_id, "repository": repository}).encode()
    manifest(files)
    return files


def manifest(files):
    files["SHA256SUMS"] = "".join(hashlib.sha256(data).hexdigest() + "  " + name + "\n"
                                 for name, data in sorted(files.items()) if name != "SHA256SUMS").encode()


def archive(files, extra=()):
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode="w:gz") as tar:
        root = tarfile.TarInfo(".")
        root.type = tarfile.DIRTYPE
        tar.addfile(root)
        for name, data in files.items():
            entry = tarfile.TarInfo("./" + name)
            entry.size = len(data)
            entry.mode = 0o777
            tar.addfile(entry, io.BytesIO(data))
        for entry, data in extra:
            tar.addfile(entry, io.BytesIO(data) if data is not None else None)
    buffer.seek(0)
    return buffer


class NextReceiverTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name)
        (self.base / "releases").mkdir()

    def receive(self, files=None, extra=(), command=COMMAND):
        return receiver.receive(command, archive(fixture() if files is None else files, extra), self.base)

    def reject(self, files=None, extra=(), command=COMMAND):
        with self.assertRaises((ValueError, OSError, tarfile.TarError, EOFError)):
            self.receive(files, extra, command)
        self.assertFalse((self.base / "current").exists())
        self.assertEqual(list((self.base / "releases").iterdir()), [])

    def test_isolated_from_the_stable_site(self):
        self.assertEqual(receiver.BASE, Path("/var/www/qds-next"))
        self.assertEqual(receiver.REQUIRED, {"index.html", "storybook/index.html"})
        stable = load("receive-site")
        self.assertNotEqual(receiver.BASE, stable.BASE)
        self.assertEqual(receiver.REPOSITORY, stable.REPOSITORY)

    def test_valid_upload_and_permissions(self):
        release = self.receive()
        self.assertEqual((self.base / "current").resolve(), release)
        self.assertEqual(json.loads((release / "release.json").read_text())["sha"], SHA)
        for path in release.rglob("*"):
            self.assertEqual(path.stat().st_mode & 0o777, 0o755 if path.is_dir() else 0o644)

    def test_release_identity(self):
        for files in (fixture(sha="b" * 40), fixture(run_id="124"), fixture(repository="other/repo")):
            with self.subTest(identity=files["release.json"]):
                self.reject(files)

    def test_bad_checksum_and_unlisted_entries(self):
        files = fixture()
        files["index.html"] = b"tampered"
        self.reject(files)
        files = fixture()
        files["extra.js"] = b"unlisted"
        self.reject(files)

    def test_required_pages(self):
        for name in receiver.REQUIRED | {"release.json", "SHA256SUMS"}:
            with self.subTest(name=name):
                files = fixture()
                del files[name]
                if name != "SHA256SUMS":
                    manifest(files)
                self.reject(files)

    def test_unsafe_paths(self):
        for name in ("../escape", "/absolute", "a/../../escape", "a\\b", "a\nb", ".ssh/key", "index.html"):
            with self.subTest(name=name):
                entry = tarfile.TarInfo(name)
                entry.size = 1
                self.reject(extra=[(entry, b"x")])

    def test_links_and_special_entries(self):
        for kind in (tarfile.SYMTYPE, tarfile.LNKTYPE, tarfile.CHRTYPE, tarfile.FIFOTYPE):
            with self.subTest(kind=kind):
                entry = tarfile.TarInfo("special")
                entry.type = kind
                entry.linkname = "index.html"
                self.reject(extra=[(entry, None)])

    def test_bounds(self):
        for constant, value in (("COMPRESSED_LIMIT", 32), ("EXPANDED_LIMIT", 1024), ("MEMBER_LIMIT", 2)):
            with self.subTest(limit=constant), patch.object(receiver, constant, value):
                self.reject()

    def test_only_the_next_command_is_accepted(self):
        for command in ("", COMMAND + "\n", COMMAND + "; id", "deploy " + SHA + " " + RUN,
                        "deploy-next " + "A" * 40 + " 1", "deploy-next " + SHA + " -1"):
            with self.subTest(command=command):
                self.reject(command=command)
        result = subprocess.run([sys.executable, receiver.__file__, "--base", self.temp.name],
                                input=b"", capture_output=True, env={**os.environ, "SSH_ORIGINAL_COMMAND": COMMAND})
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(b"CLI arguments are not accepted", result.stderr)

    def test_atomic_promotion_keeps_previous_release_and_one_asset_generation(self):
        releases = []
        for number, letter in enumerate("abc", 1):
            files = fixture(sha=letter * 40, run_id=str(number))
            del files["assets/new-abc123.js"]
            files["assets/" + letter + "-hash.js"] = letter.encode()
            manifest(files)
            releases.append(self.receive(files, command="deploy-next " + letter * 40 + " " + str(number)))
            expected = set("abc"[max(0, number - 2):number])
            self.assertEqual({p.name for p in (releases[-1] / "assets").iterdir()}, {e + "-hash.js" for e in expected})
            self.assertEqual({p.name for p in (releases[-1] / "storybook/assets").iterdir()}, {"manager.js"})
        self.assertTrue(all(release.is_dir() for release in releases))
        bad = fixture()
        bad["index.html"] = b"corrupt"
        with self.assertRaises(ValueError):
            self.receive(bad)
        self.assertEqual((self.base / "current").resolve(), releases[-1])

    def test_promotion_failure_keeps_current(self):
        old = self.receive()
        original_replace = os.replace
        def fail_current(source, dest):
            if Path(dest) == self.base / "current":
                raise OSError("simulated promotion failure")
            return original_replace(source, dest)
        with patch.object(receiver.os, "replace", side_effect=fail_current), self.assertRaises(OSError):
            self.receive()
        self.assertEqual((self.base / "current").resolve(), old)
        self.assertFalse(list(self.base.glob(".current-*")))


class NextAssemblyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.gallery = self.root / "gallery"
        self.storybook = self.root / "book"
        for name, data in fixture().items():
            if name in ("release.json", "SHA256SUMS"):
                continue
            target = (self.storybook / name.removeprefix("storybook/")) if name.startswith("storybook/") \
                else self.gallery / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
        self.output = self.root / "site"

    def assemble(self):
        assembler.assemble(self.gallery, self.storybook, self.output, SHA, RUN, receiver.REPOSITORY)

    def test_exact_build_and_receiver_round_trip(self):
        self.assemble()
        files = {path.relative_to(self.output).as_posix(): path.read_bytes()
                 for path in self.output.rglob("*") if path.is_file()}
        self.assertEqual(set(files), set(fixture()))
        for name in set(files) - {"release.json", "SHA256SUMS"}:
            self.assertEqual(files[name], fixture()[name])
        base = self.root / "server"
        (base / "releases").mkdir(parents=True)
        receiver.receive(COMMAND, archive(files), base)
        self.assertTrue((base / "current/storybook/index.html").is_file())

    def test_symlink_hidden_and_reserved_build_paths(self):
        for name in (".secret", "release.json", "SHA256SUMS", "storybook"):
            path = self.gallery / name
            path.write_bytes(b"unexpected")
            with self.subTest(name=name), self.assertRaises(ValueError):
                self.assemble()
            path.unlink()
        (self.gallery / "link").symlink_to(self.gallery / "index.html")
        with self.assertRaises(ValueError):
            self.assemble()

    def test_missing_pages_and_existing_output(self):
        (self.storybook / "index.html").unlink()
        with self.assertRaises(ValueError):
            self.assemble()
        with self.assertRaises(ValueError):
            self.assemble()

    def test_invalid_identity(self):
        with self.assertRaises(ValueError):
            assembler.assemble(self.gallery, self.storybook, self.output, "A" * 40, RUN, receiver.REPOSITORY)


if __name__ == "__main__":
    unittest.main()
