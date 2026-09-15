# SyncSameProps - 批量同步修改相似属性

![SyncSameProps cover](assets/community-cover.png)

[English](#english) · [中文](#中文)

## 中文

甲方让你统一改颜色、调整文字属性或删除描边时，还在逐个手动修改吗？现在有了更简单的方法。

1. 单选一个基准对象。
2. 任意勾选需要同步的属性，然后开始跟踪。
3. 修改基准对象，所选属性相同的其他对象会自动同步更新。

属性组合同时决定“哪些对象相同”和“具体同步哪些内容”。例如，只勾选“字号”时，所有字号相同的文本都会参与；同时勾选“字体、字号、填充”时，只有三项完全相同的文本参与同步。

### 功能

- 从 23 项属性中自由组合跟踪规则。
- 支持填充、描边、外观、尺寸形态与完整文本属性。
- 内置“文字常用、视觉样式、尺寸形态”快捷组合。
- 实时显示当前匹配对象数量。
- 自动加载文本字体，并通过 Figma Resize API 正确写入宽高。
- 兼容 Figma 属性菜单的悬停预览与回滚，不会丢失正式修改。

### 导入 Figma 使用

> 需要使用 **Figma 桌面版**。网页版不能从本地 `manifest.json` 导入开发插件。

1. 打开 [v2.0.1 Release](https://github.com/believeinmyself889-lang/SyncSameProps/releases/tag/v2.0.1)，在 **Assets** 中下载 `Source code (zip)`。
2. 完整解压 ZIP；不要只把 `manifest.json` 单独拖出来，插件需要同时读取同目录中的 `code.js` 和 `ui.html`。
3. 启动 Figma 桌面版并打开任意 Design 文件。
4. 点击左上角 Figma 菜单，进入 **Plugins → Development → Import plugin from manifest…**。
5. 选择解压目录中的 `manifest.json`。
6. 导入后，从 **Plugins → Development** 运行 **SyncSameProps - 批量同步修改相似属性**。
7. 在画布中单选一个基准对象，在插件面板勾选属性，点击“开始跟踪”，然后修改基准对象。

插件运行时必须保持面板打开。更完整的更新方法和故障排查见 [Figma 导入与使用教程](docs/FIGMA_IMPORT_GUIDE.md)。

## English

When a client asks you to change colors, update text properties, or remove borders, are you still making every change manually, one by one? SyncSameProps gives you a faster workflow.

1. Select one reference object.
2. Choose any properties and start tracking.
3. Edit the reference object. Other objects that matched the selected properties automatically update with it.

Your selected properties define both the matching rule and the synchronization scope. Select only **Font size** to update all text with the same size, or combine **Font**, **Font size**, and **Fill** to target only text objects matching all three properties.

### Features

- Build any tracking rule from 23 supported properties.
- Covers fills, strokes, appearance, geometry, and typography.
- Includes quick presets for common text, visual-style, and size workflows.
- Shows the current number of matching objects before you edit.
- Loads fonts safely and writes dimensions through Figma's Resize API.
- Preserves final synchronization after Figma property-menu hover previews roll back.

### Import into Figma

1. Download `Source code (zip)` from the [v2.0.1 release](https://github.com/believeinmyself889-lang/SyncSameProps/releases/tag/v2.0.1) and extract the entire archive.
2. Open a Design file in the **Figma desktop app**.
3. Go to **Plugins → Development → Import plugin from manifest…**.
4. Select `manifest.json` from the extracted folder.
5. Run **SyncSameProps - 批量同步修改相似属性** from **Plugins → Development**.
6. Select one reference object, choose the properties, start tracking, and edit the reference object.

See the [complete Figma import and usage guide](docs/FIGMA_IMPORT_GUIDE.md) for updates and troubleshooting.

## Development

No build step or external dependency is required.

```powershell
npm test
npm run check
```

## License

Source available under the [MIT License with Commons Clause and a commercial-output clarification](LICENSE).

- You may use SyncSameProps for paid design work, client projects, and other commercial output.
- You may modify and redistribute it for free while preserving the license notice.
- You may not sell the plugin itself, sell a renamed or modified copy, charge for downloads or access, or offer it as a substantially similar paid service without written permission.

This is a source-available license, not an OSI-approved open-source license. Versions previously obtained under an earlier license retain the rights granted with those versions.
