import axios from 'axios'
import type { ClassArchivePreview } from '../../../types'

/**
 * What archiving a class would mean for its members (ocf-core#491): who is in
 * no other open class of the organization, and how long the organization
 * keeps an offboarded member before erasure.
 */
export const classArchiveService = {
  async getArchivePreview(groupId: string): Promise<ClassArchivePreview> {
    const response = await axios.get(`/class-groups/${groupId}/archive-preview`)
    return response.data.data || response.data
  }
}
