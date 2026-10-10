# Maxos Engine Mods

Maxos Engine supports data-driven mod packs. A mod can add songs and charts without changing engine source files. In the browser version, load a mod by selecting its folder in the **Mod Manager**.

## Folder layout

```text
my-mod/
  mod.json
  charts/
    my-song.json
  audio/
    my-song.ogg
```

## mod.json

```json
{
  "format": "maxos-mod",
  "apiVersion": 1,
  "id": "my-mod",
  "name": "My First Mod",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "My first Maxos Engine mod.",
  "songs": [
    {
      "id": "my-song",
      "title": "My Song",
      "chart": "charts/my-song.json",
      "audio": "audio/my-song.ogg"
    }
  ]
}
```

The `audio` property is optional. If supplied, that file must be inside the selected mod folder. If omitted, the song runs with the practice clock and the player can load audio separately.

## Chart format

Charts use the Maxos chart JSON format. Note times and sustain lengths are milliseconds; lanes are zero-based (0 left, 1 down, 2 up, 3 right). The chart's `song`, `bpm`, `offset`, and `notes` fields are validated when the mod loads.

## Loading a mod

1. Extract the mod so its folder contains `mod.json`.
2. Open Maxos Engine in a desktop browser that supports selecting folders.
3. In **Mod Manager**, choose the mod folder.
4. Select the mod and its song, then press **Play Chart**.

The included `demo-neon` folder is a sample mod pack. Mod content is loaded as data; Maxos Engine does **not** execute arbitrary JavaScript from mod folders. Character/stage asset packs, scripted mods, mod load order/overrides, and Lua compatibility are future work.
