# SyncSameProps：Figma 导入与使用教程

[English guide](#english-guide)

## 一、下载插件

1. 打开 [SyncSameProps v2.0.1](https://github.com/believeinmyself889-lang/SyncSameProps/releases/tag/v2.0.1)。
2. 展开页面底部的 **Assets**。
3. 点击 **Source code (zip)** 下载插件。
4. 将 ZIP 完整解压到一个长期保留的文件夹，例如 `Documents/SyncSameProps`。

不要只复制 `manifest.json`。以下文件必须保持在同一插件目录中：

```text
SyncSameProps/
├── manifest.json
├── code.js
└── ui.html
```

移动或删除这个目录后，Figma 将无法继续运行已经导入的开发插件。

## 二、导入 Figma

本地开发插件只能通过 **Figma 桌面版**导入，网页版不支持此操作。

1. 启动 Figma 桌面版。
2. 新建或打开一个 Figma Design 文件。
3. 点击左上角的 Figma 标志，打开主菜单。
4. 依次进入 **Plugins → Development → Import plugin from manifest…**。
5. 在文件选择器中找到解压后的插件目录。
6. 选择 `manifest.json`，然后确认打开。

导入成功后，插件会出现在 **Plugins → Development** 中，名称为：

> SyncSameProps - 批量同步修改相似属性

## 三、运行插件

1. 打开需要修改的 Design 文件。
2. 进入 **Plugins → Development → SyncSameProps - 批量同步修改相似属性**。
3. 保持插件面板打开。关闭面板后，实时跟踪会停止。

也可以在画布空白处右键，从 **Plugins → Development** 中运行插件。

## 四、批量同步属性

1. 在画布中**单选一个对象**作为基准；不要同时选择多个对象。
2. 在插件面板中勾选需要参与匹配和同步的属性。
3. 点击 **开始跟踪**。
4. 面板右侧的数字表示当前找到的匹配对象数量。
5. 在 Figma 属性面板或画布上修改基准对象，其他匹配对象会自动更新。

所选属性同时决定匹配条件和同步内容：

- 只选择“字号”：字号相同的文本参与同步，修改时只更新字号。
- 选择“字体 + 字号 + 填充”：只有三项全部相同的文本参与，同步时也只更新这三项。
- 选择“宽度 + 高度”：尺寸相同的对象参与，修改基准尺寸后一起变化。
- 选择“填充 + 描边”：两项都相同的对象参与；可用于统一改色或删除描边。

更换基准对象、修改属性组合或点击面板中的刷新按钮后，插件会重新计算匹配对象。

## 五、更新插件

1. 从最新的 GitHub Release 下载新版 ZIP。
2. 关闭正在运行的 SyncSameProps 面板。
3. 用新版文件替换原插件目录中的文件，并保持目录位置不变。
4. 在 Figma 中重新运行插件。

如果你把新版解压到了另一个位置，请从 **Plugins → Development → Import plugin from manifest…** 重新选择新版 `manifest.json`。

## 六、常见问题

### 找不到“Import plugin from manifest…”

确认使用的是 Figma 桌面版，并且已经打开一个 Design 文件。网页版和部分非 Design 编辑器不会显示完整的开发插件菜单。

### “开始跟踪”按钮不可点击

确认已经单选一个基准对象，并至少勾选一个当前对象支持的属性。灰色属性表示不适用于当前基准对象。

### 显示 0 个匹配对象

其他对象必须在所有已选属性上与基准修改前的状态一致。减少匹配属性或选择一个更合适的基准后重新匹配。

### 修改后没有同步

确认插件面板仍然打开、状态显示“正在跟踪”，并且修改的是已勾选的属性。更换基准后可点击刷新按钮重新建立匹配组。

### 字体无法修改

目标电脑需要安装相应字体。缺失字体或混合字体状态可能导致该对象被跳过。

---

## English guide

### Download and extract

1. Open the [v2.0.1 release](https://github.com/believeinmyself889-lang/SyncSameProps/releases/tag/v2.0.1).
2. Under **Assets**, download **Source code (zip)**.
3. Extract the complete archive to a folder you plan to keep. `manifest.json`, `code.js`, and `ui.html` must remain together.

### Import into the Figma desktop app

1. Open a Figma Design file in the desktop app.
2. Open the Figma menu and choose **Plugins → Development → Import plugin from manifest…**.
3. Select the extracted `manifest.json`.
4. Run **SyncSameProps - 批量同步修改相似属性** from **Plugins → Development**.

### Use the plugin

1. Select exactly one reference object.
2. Choose one or more properties in the plugin panel.
3. Click **Start tracking**.
4. Edit the selected properties on the reference object. Matching objects update automatically.
5. Keep the plugin panel open while tracking.

To update the development version, replace the files in the same imported folder and reopen the plugin. If the folder location changes, import the new `manifest.json` again.
