import { addCollection, addIcon, Icon, type IconifyJSON } from '@iconify/vue/offline'
import lucideIcons from '@iconify-json/lucide/icons.json'
import hugeiconsIcons from '@iconify-json/hugeicons/icons.json'
import materialSymbolsIcons from '@iconify-json/material-symbols/icons.json'
import materialSymbolsLightIcons from '@iconify-json/material-symbols-light/icons.json'
import radixIcons from '@iconify-json/radix-icons/icons.json'
import mdiIcons from '@iconify-json/mdi/icons.json'
import carbonIcons from '@iconify-json/carbon/icons.json'
import fluentColorIcons from '@iconify-json/fluent-color/icons.json'
import heroiconsIcons from '@iconify-json/heroicons/icons.json'
import iCIcons from '@iconify-json/ic/icons.json'
import iconParkIcons from '@iconify-json/icon-park/icons.json'
import lineMdIcons from '@iconify-json/line-md/icons.json'
import mingcuteIcons from '@iconify-json/mingcute/icons.json'
import phIcons from '@iconify-json/ph/icons.json'
import solarIcons from '@iconify-json/solar/icons.json'
import streamlineIcons from '@iconify-json/streamline/icons.json'
import streamlineColorIcons from '@iconify-json/streamline-color/icons.json'
import ouiIcons from '@iconify-json/oui/icons.json'
import materialIconThemeIcons from '@iconify-json/material-icon-theme/icons.json'
import selfHostedIcons from '@iconify-json/selfhst/icons.json'
import logosIcons from '@iconify-json/logos/icons.json'

let registered = false

function registerCollections() {
  if (registered) {
    return
  }

  addCollection(lucideIcons as IconifyJSON)
  addCollection(hugeiconsIcons as IconifyJSON)
  addCollection(materialSymbolsIcons as IconifyJSON)
  addCollection(materialSymbolsLightIcons as IconifyJSON)
  addCollection(radixIcons as IconifyJSON)
  addCollection(mdiIcons as IconifyJSON)
  addCollection(carbonIcons as IconifyJSON)
  addCollection(fluentColorIcons as IconifyJSON)
  addCollection(heroiconsIcons as IconifyJSON)
  addCollection(iCIcons as IconifyJSON)
  addCollection(iconParkIcons as IconifyJSON)
  addCollection(lineMdIcons as IconifyJSON)
  addCollection(mingcuteIcons as IconifyJSON)
  addCollection(phIcons as IconifyJSON)
  addCollection(solarIcons as IconifyJSON)
  addCollection(streamlineIcons as IconifyJSON)
  addCollection(streamlineColorIcons as IconifyJSON)
  addCollection(ouiIcons as IconifyJSON)
  addCollection(materialIconThemeIcons as IconifyJSON)
  addCollection(selfHostedIcons as IconifyJSON)
  addCollection(logosIcons as IconifyJSON)
  registered = true
}

registerCollections()

export { addCollection, addIcon, Icon }
export default Icon
