import { QuickReplySchema } from '#database/schema'
import { TenantScoped } from '#models/mixins/tenant_scoped'
import { compose } from '@adonisjs/core/helpers'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Tenant from '#models/tenant'
import { mediaKindFromExt, type MediaItem } from '#services/storage/media_helpers'

export default class QuickReply extends compose(QuickReplySchema, TenantScoped) {
  @belongsTo(() => Tenant)
  declare tenant: BelongsTo<typeof Tenant>

  /**
   * Normalized media list. Supports the new `{ items: [...] }` shape and the
   * legacy single `{ url }` shape (kind inferred from the URL extension).
   */
  get mediaItems(): MediaItem[] {
    const media = this.media as
      { items?: MediaItem[]; url?: string; key?: string } | MediaItem[] | null
    if (!media) return []
    if (Array.isArray(media)) return media
    if (Array.isArray(media.items)) return media.items
    if (media.key) {
      const ext = media.key.split('.').pop() ?? ''
      return [{ key: media.key, type: mediaKindFromExt(ext) }]
    }
    return []
  }
}
