import { test } from '@japa/runner'
import { buildQuickReplyContent } from '#services/catalog/quick_reply_content'
import { mediaKindFromExt } from '#services/storage/media_helpers'
import type { MediaItem } from '#services/storage/media_helpers'

const img = (n = 1): MediaItem[] =>
  Array.from({ length: n }, (_, i) => ({ key: `k${i}.png`, type: 'image' as const }))

test.group('buildQuickReplyContent', () => {
  test('text requires a body and drops media', ({ assert }) => {
    assert.property(buildQuickReplyContent('text', '  ', []), 'error')
    const ok = buildQuickReplyContent('text', 'Hello', [])
    assert.deepInclude(ok, { contentType: 'text', body: 'Hello', media: null })
  })

  test('hybrid needs exactly one media file + a body', ({ assert }) => {
    assert.property(buildQuickReplyContent('hybrid', 'hi', []), 'error')
    assert.property(buildQuickReplyContent('hybrid', 'hi', img(2)), 'error')
    assert.property(buildQuickReplyContent('hybrid', '', img(1)), 'error')
    const ok = buildQuickReplyContent('hybrid', 'caption', img(1))
    assert.notProperty(ok, 'error')
  })

  test('media-only allows 1–5 files, body optional', ({ assert }) => {
    assert.property(buildQuickReplyContent('image', null, []), 'error')
    assert.property(buildQuickReplyContent('image', null, img(6)), 'error')
    const ok = buildQuickReplyContent('image', null, img(3)) as any
    assert.notProperty(ok, 'error')
    assert.lengthOf(ok.media.items, 3)
  })

  test('media-only rejects a mismatched file kind', ({ assert }) => {
    const mixed: MediaItem[] = [{ key: 'a.mp4', type: 'video' }]
    assert.property(buildQuickReplyContent('image', null, mixed), 'error')
  })
})

test.group('mediaKindFromExt', () => {
  test('classifies by extension', ({ assert }) => {
    assert.equal(mediaKindFromExt('PNG'), 'image')
    assert.equal(mediaKindFromExt('mp4'), 'video')
    assert.equal(mediaKindFromExt('pdf'), 'document')
    assert.equal(mediaKindFromExt('bin'), 'document')
  })
})
