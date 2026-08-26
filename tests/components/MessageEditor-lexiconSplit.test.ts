/**
 * The vocabulary and the messages are two views of one document.
 *
 * That is the whole hazard worth testing here. A save replaces the entire
 * lexicon server-side, so a screen that showed a filtered list and then acted
 * on a row's *position* would act on the wrong entry — and a screen holding its
 * own copy would send a document missing whatever the other screen had changed.
 * Neither failure announces itself: the world simply loses a room, or a French
 * sentence reverts to English on its own.
 */

import { describe, it, expect } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { ref } from 'vue'

import MessageEditor from '../../src/components/ScenarioEditor/MessageEditor.vue'
import LexiconEditor from '../../src/components/ScenarioEditor/LexiconEditor.vue'
import type { ScenarioLexicon, LexiconEntry } from '../../src/composables/useScenarioLexicon'

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: { en: {}, fr: {} },
    missingWarn: false,
    fallbackWarn: false,
  })
}

function entry(key: string, kind: string, names: Record<string, string>): LexiconEntry {
  return { key, parent_key: '', kind, names }
}

/** A lexicon holding both kinds, as a real one does. */
function fakeLexicon(entries: LexiconEntry[]): ScenarioLexicon & { saved: LexiconEntry[][] } {
  const saved: LexiconEntry[][] = []
  return {
    entries: ref(entries),
    problems: ref([]),
    scriptLiterals: ref([]),
    isLoading: ref(false),
    isSaving: ref(false),
    saveError: ref(''),
    ensureLoaded: async () => {},
    reload: async () => {},
    save: async function (this: any) {
      saved.push(JSON.parse(JSON.stringify(this.entries.value)))
    },
    saved,
  } as any
}

const WORLD_AND_MESSAGES = () => [
  entry('CELLAR', 'place', { en: 'Cellar', fr: 'Cave' }),
  entry('STEP3_REFUSED', 'message', { en: 'You are not back at the entrance.', fr: '' }),
  entry('CHEST', 'place', { en: 'Chest', fr: 'Coffre' }),
  entry('STEP5_SPIDERS', 'message', { en: 'Still %s spider(s)!', fr: 'Il reste %s araignée(s) !' }),
]

function mountMessages(lexicon: ScenarioLexicon): VueWrapper {
  return mount(MessageEditor, {
    props: { lexicon, locales: ['en', 'fr'], defaultLocale: 'en' },
    global: { plugins: [createTestI18n()] },
  })
}

describe('MessageEditor', () => {
  it('shows the messages and none of the world', () => {
    const wrapper = mountMessages(fakeLexicon(WORLD_AND_MESSAGES()))

    expect(wrapper.find('[data-testid="message-STEP3_REFUSED"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="message-STEP5_SPIDERS"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="message-CELLAR"]').exists()).toBe(false)
  })

  it('gives every declared language its own box, including an untranslated one', () => {
    const wrapper = mountMessages(fakeLexicon(WORLD_AND_MESSAGES()))

    const french = wrapper.find('[data-testid="message-text-STEP3_REFUSED-fr"]')
    expect(french.exists()).toBe(true)
    expect((french.element as HTMLTextAreaElement).value).toBe('')
    expect(french.classes()).toContain('ocf-message-empty')
  })

  // A message with placeholders is a printf format string. A translation that
  // drops one prints the wrong number, and the sentence itself gives no sign.
  it('warns when a translation has a different number of placeholders', async () => {
    const lexicon = fakeLexicon(WORLD_AND_MESSAGES())
    const wrapper = mountMessages(lexicon)

    expect(wrapper.find('[data-testid="message-slots-STEP5_SPIDERS-fr"]').exists()).toBe(false)

    lexicon.entries.value[3].names.fr = 'Il reste des araignées !'
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="message-slots-STEP5_SPIDERS-fr"]').exists()).toBe(true)
  })

  it('does not call an untranslated message a mismatch', () => {
    const wrapper = mountMessages(fakeLexicon(WORLD_AND_MESSAGES()))
    expect(wrapper.find('[data-testid="message-slots-STEP3_REFUSED-fr"]').exists()).toBe(false)
  })

  // Someone who read a bad sentence in the player has the sentence, not the key.
  it('filters on the text as well as the key', async () => {
    const wrapper = mountMessages(fakeLexicon(WORLD_AND_MESSAGES()))

    await wrapper.find('[data-testid="messages-filter"]').setValue('araignée')

    expect(wrapper.find('[data-testid="message-STEP5_SPIDERS"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="message-STEP3_REFUSED"]').exists()).toBe(false)
  })

  it('saves the whole document, not just the messages it shows', async () => {
    const lexicon = fakeLexicon(WORLD_AND_MESSAGES())
    const wrapper = mountMessages(lexicon)

    await wrapper.find('[data-testid="messages-save"]').trigger('click')

    const sent = (lexicon as any).saved[0]
    expect(sent).toHaveLength(4)
    expect(sent.map((e: LexiconEntry) => e.key)).toContain('CELLAR')
  })
})

describe('LexiconEditor beside it', () => {
  function mountWorld(lexicon: ScenarioLexicon): VueWrapper {
    return mount(LexiconEditor, {
      props: { lexicon, locales: ['en', 'fr'], defaultLocale: 'en' },
      global: { plugins: [createTestI18n()] },
    })
  }

  it('shows the world and none of the messages', () => {
    const wrapper = mountWorld(fakeLexicon(WORLD_AND_MESSAGES()))
    const keys = wrapper.findAll('[data-testid^="lexicon-key-"]')
      .map(input => (input.element as HTMLInputElement).value)

    expect(keys).toEqual(['CELLAR', 'CHEST'])
  })

  // The rows shown are a filtered view, so a row's position is not the entry's
  // position in the document. Removing by index would delete a message.
  it('removes the row it was asked to, not the one at that position', async () => {
    const lexicon = fakeLexicon(WORLD_AND_MESSAGES())
    const wrapper = mountWorld(lexicon)

    // The second row shown is CHEST, which sits third in the document.
    await wrapper.findAll('[data-testid^="lexicon-remove-"]')[1].trigger('click')

    const left = lexicon.entries.value.map(e => e.key)
    expect(left).toEqual(['CELLAR', 'STEP3_REFUSED', 'STEP5_SPIDERS'])
  })
})
