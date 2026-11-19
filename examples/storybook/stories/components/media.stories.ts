import type { Meta } from '@storybook/vue3-vite'
import { ref } from 'vue'
import { QCarousel, QCarouselSlide, QChatMessage, QEditor, QImg, QKnob, QRating, QUploader } from 'quasar'
import CarouselApi from 'quasar/dist/api/QCarousel.json'
import RatingApi from 'quasar/dist/api/QRating.json'
import KnobApi from 'quasar/dist/api/QKnob.json'
import EditorApi from 'quasar/dist/api/QEditor.json'
import UploaderApi from 'quasar/dist/api/QUploader.json'
import ImgApi from 'quasar/dist/api/QImg.json'
import ChatMessageApi from 'quasar/dist/api/QChatMessage.json'
import CatalogComplexMedia from '@gallery/sections/catalog/CatalogComplexMedia.vue'
import ComplexMediaShowcase from '../../demos/ComplexMediaShowcase.vue'
import { color, controls, ICONS, showcase, type Story } from '../support/story-kit'

const SCENES = ['win', 'ink', 'one', 'term'].map((name) => `/scenes/qds-wallpaper-${name}.svg`)

export default {
  title: 'Components/Media',
  tags: ['autodocs'],
  parameters: {
    docs: { description: { component: 'Carousels, ratings, knobs, rich text, uploads, images and chat bubbles.' } },
  },
} satisfies Meta

export const Showcase = showcase(ComplexMediaShowcase, 'Stepper, media, ratings, plugins and rich-content shells.')
export const Gallery = showcase(CatalogComplexMedia, 'The gallery complex and media family.')

export const Carousel: Story = {
  args: { arrows: true, navigation: true, thumbnails: false, swipeable: true, animated: true, infinite: false, vertical: false, height: '18rem', controlColor: 'primary' },
  argTypes: controls(CarouselApi, { arrows: true, navigation: true, thumbnails: true, swipeable: true, animated: true, infinite: true, vertical: true, height: true, controlColor: color() }),
  render: (args) => ({
    components: { QCarousel, QCarouselSlide },
    setup: () => ({ args, slide: ref(0), scenes: SCENES }),
    template: `
      <QCarousel v-model="slide" v-bind="args" style="max-width: 36rem" aria-label="Wallpapers">
        <QCarouselSlide v-for="(src, index) in scenes" :key="src" :name="index" :img-src="src" />
      </QCarousel>`,
  }),
}

export const Rating: Story = {
  args: { max: 5, size: '2em', color: 'warning', readonly: false, disable: false, noReset: false },
  argTypes: controls(RatingApi, { max: true, size: true, color: color(), readonly: true, disable: true, noReset: true }),
  render: (args) => ({
    components: { QRating },
    setup: () => ({ args, model: ref(3), icons: ICONS }),
    template: '<QRating v-model="model" v-bind="args" :icon="icons.star" aria-label="Rating" />',
  }),
}

export const Knob: Story = {
  args: { min: 0, max: 100, step: 1, size: '6rem', thickness: 0.22, color: 'primary', trackColor: 'grey-3', showValue: true, readonly: false, disable: false },
  argTypes: controls(KnobApi, { min: true, max: true, step: true, size: true, thickness: { control: { type: 'range', min: 0, max: 1, step: 0.02 } }, color: color(), trackColor: { ...color('Track colour'), options: ['grey-3', 'transparent', 'primary'] }, showValue: true, readonly: true, disable: true }),
  render: (args) => ({
    components: { QKnob },
    setup: () => ({ args, model: ref(64) }),
    template: '<QKnob v-model="model" v-bind="args" aria-label="Brightness" />',
  }),
}

export const Editor: Story = {
  args: { minHeight: '8rem', dense: false, flat: false, square: false, readonly: false, disable: false },
  argTypes: controls(EditorApi, { minHeight: true, dense: true, flat: true, square: true, readonly: true, disable: true }),
  render: (args) => ({
    components: { QEditor },
    setup: () => ({ args, model: ref('<p><strong>Release note</strong>: tokens are frozen for the release candidate.</p>') }),
    template: '<QEditor v-model="model" v-bind="args" style="max-width: 40rem" />',
  }),
}

export const Uploader: Story = {
  args: { label: 'Upload assets', color: 'primary', multiple: true, flat: false, bordered: true, square: false, disable: false },
  argTypes: controls(UploaderApi, { label: true, color: color(), multiple: true, flat: true, bordered: true, square: true, disable: true }),
  render: (args) => ({
    components: { QUploader },
    setup: () => ({ args }),
    template: '<QUploader v-bind="args" url="" :auto-upload="false" style="max-width: 24rem" />',
  }),
}

export const Image: Story = {
  args: { src: SCENES[1], ratio: 16 / 9, fit: 'cover', spinnerColor: 'primary', caption: 'Ink wallpaper' },
  argTypes: {
    src: { description: 'Image source', control: { type: 'select' }, options: SCENES },
    caption: { description: 'Caption overlay', control: { type: 'text' } },
    ...controls(ImgApi, { ratio: true, fit: true, spinnerColor: color() }),
  },
  render: (args) => ({
    components: { QImg },
    setup: () => ({ args }),
    template: `
      <QImg :src="args.src" :ratio="args.ratio" :fit="args.fit" :spinner-color="args.spinnerColor" :alt="args.caption" style="max-width: 32rem">
        <div v-if="args.caption" class="absolute-bottom text-subtitle2">{{ args.caption }}</div>
      </QImg>`,
  }),
}

export const ChatMessage: Story = {
  args: { name: 'Ada', text: 'Tokens are frozen, can you check the catalog?', stamp: '2 minutes ago', bgColor: '', textColor: '' },
  argTypes: controls(ChatMessageApi, { name: true, stamp: true, bgColor: { ...color('Bubble colour'), options: ['', 'primary', 'secondary', 'grey-3'] }, textColor: { ...color('Text colour'), options: ['', 'white', 'dark'] } }),
  render: (args) => ({
    components: { QChatMessage },
    setup: () => ({ args }),
    template: `
      <div style="max-width: 32rem">
        <QChatMessage :name="args.name" :text="[args.text]" :stamp="args.stamp" :bg-color="args.bgColor || undefined" :text-color="args.textColor || undefined" />
        <QChatMessage name="Me" :text="['Looking now.']" stamp="just now" sent />
      </div>`,
  }),
}
