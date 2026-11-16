import { flushPromises, type VueWrapper } from '@vue/test-utils'

/** Hand a file to the file input, as picking one in the browser does. */
export async function pickFile(wrapper: VueWrapper, file: File) {
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await flushPromises()
}
