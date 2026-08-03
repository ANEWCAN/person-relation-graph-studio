<div align="center">
  <img src="docs/logo.png" width="156" alt="Person Relation Graph Studio logo">
  <h1>Person Relation Graph Studio</h1>
  <p><strong>人物关系图谱工作台</strong></p>
  <p>一个零第三方依赖、可本地运行的人物关系图谱创建与可视化工具。</p>

## 项目简介

Person Relation Graph Studio 是一个面向人物关系数据的本地网页工具。它使用 Python 标准库提供本地服务，并通过原生 HTML、CSS、JavaScript 和 Canvas 完成图谱渲染，无需 Flask、数据库、Node.js 或外部 CDN。

数据默认只保存在当前浏览器中，不会上传到第三方服务器，适合人物关系梳理、故事角色设计、组织关系分析、访谈材料整理和社交网络概览等场景。

## 主要功能

- 在线添加、编辑和删除人物与关系
- 支持名称、性别、头像、标签、备注等人物属性
- 支持关系名称、方向、箭头、权重、颜色、线型和备注
- 内置 100 个差异化 SVG 头像：男性 50 个、女性 50 个
- 支持本地上传头像和浏览器即时生成头像
- 新建人物头像加载失败时自动切换为本地生成的备用头像
- 导入 JSON、CSV 或 Excel 后，未设置头像的人物会按性别自动分配头像
- 男性默认蓝色边框，女性默认红色边框
- 将画布交互拆分为“选择”“聚焦”“快速连线”三种独立模式
- 选择模式只选中人物或关系，不会覆盖侧边栏尚未保存的输入
- 聚焦模式可突出显示 1～3 度关系网络，其他节点自动淡化
- 已进入子网络后仍可切换到选择模式，单独选择其中的人物或关系
- 快速连线模式下依次点击两个节点即可直接建立关系
- 支持力导向、环形、网格、中心辐射、层级和随机布局
- 支持一键自动整理，以及新增人物、关系或导入数据后的自动分布
- 支持 JSON、CSV、Excel 文件导入与在线粘贴导入
- 支持 JSON、Excel、CSV、GraphML 数据导出
- 支持 PNG 和 JPG 高清关系图保存
- 支持搜索、筛选、节点固定、撤销、重做和浏览器本地自动保存

## 快速开始

### 环境要求

- Python 3.10 或更高版本
- Chrome、Edge、Firefox 或其他现代浏览器

项目没有第三方 Python 依赖，因此不需要执行 `pip install`。

### Windows

在项目目录打开 PowerShell：

```powershell
python .\start.py
```

安装了 Python Launcher 时，也可以运行：

```powershell
py -3 .\start.py
```

也可以双击：

```text
run.bat
```

### macOS / Linux

```bash
chmod +x run.sh
./run.sh
```

启动后浏览器通常会自动打开：

```text
http://127.0.0.1:5000
```

如果端口 5000 已被占用，启动器会自动尝试 5001—5010。更多说明见 [QUICK_START.md](QUICK_START.md)。

## 画布交互模式

画布左上角工具栏提供三种交互模式：

1. **选择模式**：单击人物或关系仅执行选中。右侧详情区会显示所选项目，但不会自动覆盖左侧编辑表单中的未保存内容。
2. **聚焦模式**：单击人物进入该人物的局部关系网络。通过左侧“关系网络层级”可选择 1～3 度网络。
3. **快速连线模式**：光标会变为十字形。依次选择起点和终点后，程序使用当前关系表单中的名称、方向、权重、颜色和线型直接创建关系。

“自动整理”按钮会重新计算当前可见网络的分布。在个人子网络中使用时，只整理当前子网络；“新增后自动整理”开关可控制新增和导入后的自动布局。

## 数据导入格式

项目附带可直接导入的示例文件：

- [`sample_data/example_graph.json`](sample_data/example_graph.json)
- [`sample_data/example_graph.xlsx`](sample_data/example_graph.xlsx)
- [`sample_data/edge_list.csv`](sample_data/edge_list.csv)

### JSON

```json
{
  "nodes": [
    {
      "id": "p001",
      "name": "Lin Chen",
      "gender": "male",
      "avatar": "/static/avatars/male_01.svg",
      "note": "Project owner",
      "tags": ["core"]
    }
  ],
  "edges": []
}
```

### CSV

```csv
source,target,relation,source_gender,target_gender,directed,weight,color,line_style
Lin Chen,Su Qing,colleague,male,female,false,3,#64748B,solid
```

### Excel

建议包含两个工作表：

- `nodes`：`id, name, gender, avatar, note, tags`
- `edges`：`id, source, target, relation, directed, weight, color, line_style, note`

## 项目结构

```text
person-relation-graph-studio/
├─ app.py                    # Python standard-library web server
├─ start.py                  # Cross-platform launcher
├─ run.bat                   # Windows launcher
├─ run.sh                    # macOS/Linux launcher
├─ templates/index.html      # Main page
├─ static/css/style.css      # Interface styles
├─ static/js/app.js          # Graph editor and Canvas engine
├─ static/avatars/           # 100 generated SVG avatars
├─ sample_data/              # Import examples
├─ tools/generate_avatars.py # Avatar generator
├─ tests/test_app.py         # Automated tests
├─ docs/logo.svg             # Editable project logo
├─ docs/logo.png             # README project icon
├─ docs/social-preview.png   # GitHub social preview image
└─ LICENSE                   # MIT License
```

## 本地开发与测试

直接启动开发版本：

```bash
python start.py
```

运行测试：

```bash
python -m unittest discover -s tests -v
```

重新生成头像资源：

```bash
python tools/generate_avatars.py
```

## 数据与隐私

- 图谱数据默认保存在浏览器本地存储中。
- 本地导入的数据不会自动上传到互联网。
- 自定义头像会以 Data URL 形式保存在图数据中，因此可能增大导出文件体积。
- 内置头像为程序生成的虚构 SVG 插画，不对应真实人物。
- 在公开仓库、Issue 或示例文件中，请勿提交真实个人隐私、密码、访问令牌或其他敏感信息。

## 参与贡献

欢迎提交 Issue 和 Pull Request。开始前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 开源协议

本项目采用 [MIT License](LICENSE)。可以自由使用、修改和分发，但需保留原始版权与许可声明。
