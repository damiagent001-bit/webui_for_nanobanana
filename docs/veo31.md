官方文档链接：https://ai.google.dev/gemini-api/docs/video?hl=zh-cn&example=dialogue#generate-from-images

在 Gemini API 中使用 Veo 3.1 生成视频

Veo 3.1 是 Google 最先进的模型，可生成高保真度的 8 秒 720p 或 1080p 视频，这些视频具有惊人的逼真效果和原生生成的音频。您可以使用 Gemini API 以编程方式访问此模型。如需详细了解可用的 Veo 模型变体，请参阅模型版本部分。

Veo 3.1 在各种视觉和电影风格方面表现出色，并引入了多项新功能：

视频扩展：扩展之前使用 Veo 生成的视频。
指定帧生成：通过指定第一帧和最后一帧来生成视频。
基于图片的指导：使用最多三张参考图片来指导生成的视频的内容。
如需详细了解如何编写有效的文本提示来生成视频，请参阅 Veo 提示指南

文本转视频生成
选择一个示例，了解如何生成包含对话、电影级真实感或创意动画的视频：

对话和音效 电影级真实感 创意动画

Python
JavaScript
Go
REST

import time
from google import genai
from google.genai import types

client = genai.Client()

prompt = """A close up of two people staring at a cryptic drawing on a wall, torchlight flickering.
A man murmurs, 'This must be it. That's the secret code.' The woman looks at him and whispering excitedly, 'What did you find?'"""

operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt=prompt,
)

# Poll the operation status until the video is ready.
while not operation.done:
    print("Waiting for video generation to complete...")
    time.sleep(10)
    operation = client.operations.get(operation)

# Download the generated video.
generated_video = operation.response.generated_videos[0]
client.files.download(file=generated_video.video)
generated_video.video.save("dialogue_example.mp4")
print("Generated video saved to dialogue_example.mp4")


图片转视频生成
以下代码演示了如何使用 Gemini 2.5 Flash Image（又称 Nano Banana）生成图片，然后将该图片用作起始帧，以使用 Veo 3.1 生成视频。

Python
JavaScript
Go

import time
from google import genai

client = genai.Client()

prompt = "Panning wide shot of a calico kitten sleeping in the sunshine"

# Step 1: Generate an image with Nano Banana.
image = client.models.generate_content(
    model="gemini-2.5-flash-image",
    prompt=prompt,
)

# Step 2: Generate video with Veo 3.1 using the image.
operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt=prompt,
    image=image.generated_images[0].image,
)

# Poll the operation status until the video is ready.
while not operation.done:
    print("Waiting for video generation to complete...")
    time.sleep(10)
    operation = client.operations.get(operation)

# Download the video.
video = operation.response.generated_videos[0]
client.files.download(file=video.video)
video.video.save("veo3_with_image_input.mp4")
print("Generated video saved to veo3_with_image_input.mp4")
使用参考图片
注意： 此功能仅适用于 Veo 3.1 型号
Veo 3.1 现在最多可接受 3 张参考图片，以指导生成的视频的内容。提供人物、角色或产品的图片，以便在输出视频中保留该主题的外观。

例如，使用 Nano Banana 生成的这三张图片作为参考，并搭配精心撰写的提示，即可生成以下视频：

`dress_image`	`woman_image`	`glasses_image`
高档火烈鸟连衣裙，饰有层层粉色和紫红色羽毛	一位美丽的女性，留着深色头发，有着暖棕色的眼睛	造型奇特的粉色心形太阳镜
Python

import time
from google import genai

client = genai.Client()

prompt = "The video opens with a medium, eye-level shot of a beautiful woman with dark hair and warm brown eyes. She wears a magnificent, high-fashion flamingo dress with layers of pink and fuchsia feathers, complemented by whimsical pink, heart-shaped sunglasses. She walks with serene confidence through the crystal-clear, shallow turquoise water of a sun-drenched lagoon. The camera slowly pulls back to a medium-wide shot, revealing the breathtaking scene as the dress's long train glides and floats gracefully on the water's surface behind her. The cinematic, dreamlike atmosphere is enhanced by the vibrant colors of the dress against the serene, minimalist landscape, capturing a moment of pure elegance and high-fashion fantasy."

dress_reference = types.VideoGenerationReferenceImage(
  image=dress_image, # Generated separately with Nano Banana
  reference_type="asset"
)

sunglasses_reference = types.VideoGenerationReferenceImage(
  image=glasses_image, # Generated separately with Nano Banana
  reference_type="asset"
)

woman_reference = types.VideoGenerationReferenceImage(
  image=woman_image, # Generated separately with Nano Banana
  reference_type="asset"
)

operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt=prompt,
    config=types.GenerateVideosConfig(
      reference_images=[dress_reference, glasses_reference, woman_reference],
    ),
)

# Poll the operation status until the video is ready.
while not operation.done:
    print("Waiting for video generation to complete...")
    time.sleep(10)
    operation = client.operations.get(operation)

# Download the video.
video = operation.response.generated_videos[0]
client.files.download(file=video.video)
video.video.save("veo3.1_with_reference_images.mp4")
print("Generated video saved to veo3.1_with_reference_images.mp4")
一位女士穿着时尚的高级定制服装，戴着太阳镜，在泻湖中漫步
veo3.1_with_reference_images.mp4
使用第一帧和最后一帧
注意： 此功能仅适用于 Veo 3.1 型号
借助 Veo 3.1，您可以使用插值或指定视频的第一帧和最后一帧来创建视频。如需了解如何编写有效的文本提示来生成视频，请参阅 Veo 提示指南。

Python

import time
from google import genai

client = genai.Client()

prompt = "A cinematic, haunting video. A ghostly woman with long white hair and a flowing dress swings gently on a rope swing beneath a massive, gnarled tree in a foggy, moonlit clearing. The fog thickens and swirls around her, and she slowly fades away, vanishing completely. The empty swing is left swaying rhythmically on its own in the eerie silence."

operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt=prompt,
    image=first_image, # Generated separately with Nano Banana
    config=types.GenerateVideosConfig(
      last_frame=last_image # Generated separately with Nano Banana
    ),
)

# Poll the operation status until the video is ready.
while not operation.done:
    print("Waiting for video generation to complete...")
    time.sleep(10)
    operation = client.operations.get(operation)

# Download the video.
video = operation.response.generated_videos[0]
client.files.download(file=video.video)
video.video.save("veo3.1_with_interpolation.mp4")
print("Generated video saved to veo3.1_with_interpolation.mp4")
`first_image`	`last_image`	veo3.1_with_interpolation.mp4
一位留着白色长发、身穿飘逸长裙的幽灵女子在绳索秋千上轻轻摇晃	幽灵般的女子从秋千上消失	一段电影般的诡异视频，画面中一位令人毛骨悚然的女性在雾中从秋千上消失
延长 Veo 视频
注意： 此功能仅适用于 Veo 3.1 型号
使用 Veo 3.1 可将之前使用 Veo 生成的视频延长 7 秒，最多可延长 20 次。

输入视频限制：

Veo 生成的视频时长上限为 141 秒。
Gemini API 仅支持 Veo 生成的视频的视频扩展功能。
输入视频应具有一定的时长、宽高比和尺寸：
宽高比：9:16 或 16:9
分辨率：720p
视频时长：不超过 141 秒
该扩展程序的输出是一个视频，其中包含用户输入的视频和生成的扩展视频，总时长最长为 148 秒。

此示例采用 Veo 生成的视频 butterfly_video（此处显示了其原始提示），并使用 video 参数和新提示对其进行扩展：

提示	输出：butterfly_video
一只折纸蝴蝶拍打着翅膀，从法式落地门飞到花园里。	折纸蝴蝶拍打着翅膀，从法式落地门飞到花园里。
Python

import time
from google import genai

client = genai.Client()

prompt = "Track the butterfly into the garden as it lands on an orange origami flower. A fluffy white puppy runs up and gently pats the flower."

operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    video=butterfly_video,
    prompt=prompt,
    config=types.GenerateVideosConfig(
        number_of_videos=1,
        resolution="720p"
    ),
)

# Poll the operation status until the video is ready.
while not operation.done:
    print("Waiting for video generation to complete...")
    time.sleep(10)
    operation = client.operations.get(operation)

# Download the video.
video = operation.response.generated_videos[0]
client.files.download(file=video.video)
video.video.save("veo3.1_extension.mp4")
print("Generated video saved to veo3.1_extension.mp4")
蝴蝶飞进花园，停在一朵折纸花上。一只毛茸茸的白色小狗跑过来，轻轻拍了拍花朵。
veo3.1_extension.mp4
如需了解如何编写有效的文本提示来生成视频，请参阅 Veo 提示指南。

处理异步操作
生成视频是一项计算密集型任务。当您向 API 发送请求时，它会启动一个长时间运行的作业，并立即返回一个 operation 对象。然后，您必须进行轮询，直到视频准备就绪（以 done 状态为 true 表示）。

此流程的核心是一个轮询循环，用于定期检查作业的状态。

Python
JavaScript

import time
from google import genai
from google.genai import types

client = genai.Client()

# After starting the job, you get an operation object.
operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt="A cinematic shot of a majestic lion in the savannah.",
)

# Alternatively, you can use operation.name to get the operation.
operation = types.GenerateVideosOperation(name=operation.name)

# This loop checks the job status every 10 seconds.
while not operation.done:
    time.sleep(10)
    # Refresh the operation object to get the latest status.
    operation = client.operations.get(operation)

# Once done, the result is in operation.response.
# ... process and download your video ...
Veo API 参数和规范
您可以在 API 请求中设置以下参数来控制视频生成过程。

参数	说明	Veo 3.1 和 Veo 3.1 Fast	Veo 3 和 Veo 3 Fast	Veo 2
prompt	视频的文字说明。支持音频提示。	string	string	string
negativePrompt	描述视频中不应包含的内容的文字。	string	string	string
image	要添加动画效果的初始图片。	Image 对象	Image 对象	Image 对象
lastFrame	插值视频要过渡到的最终图片。必须与 image 参数搭配使用。	Image 对象	Image 对象	Image 对象
referenceImages	最多三张图片，用作风格和内容参考。	VideoGenerationReferenceImage 对象（仅限 Veo 3.1）	无	无
video	用于视频广告附加信息的视频。	Video 对象	无	无
aspectRatio	视频的宽高比。	"16:9"（默认，720p 和 1080p）、
"9:16"（720p 和 1080p）

"16:9"（默认，720p 和 1080p）、
"9:16"（720p 和 1080p）	"16:9"（默认，720p）、
"9:16" (720p)
resolution	视频的宽高比。	"720p"（默认）、
"1080p"（仅支持 8 秒时长）

"720p" 仅适用于扩展程序	"720p"（默认）、
"1080p"（仅限 16:9）	不支持
durationSeconds	生成的视频的时长。	"4"，"6"，"8"。

使用扩展或插值时（同时支持 16:9 和 9:16）以及使用 referenceImages 时（仅支持 16:9），必须为“8”	"4"、"6"、"8"	"5"、"6"、"8"
personGeneration	控制人物生成。
（有关地区限制，请参阅限制）	文生视频和扩展功能：仅限
"allow_all" 图生视频、插帧和参考图片：仅限
"allow_adult"
文生视频：仅限
"allow_all" 图生视频：仅限
"allow_adult"
文生视频：
"allow_all"、"allow_adult"、"dont_allow" 图生视频：
"allow_adult"和 "dont_allow"
请注意，seed 参数也适用于 Veo 3 模型。它不能保证确定性，但可以略微提高确定性。

您可以在请求中设置参数，自定义视频生成。 例如，您可以指定 negativePrompt 来引导模型。

Python
JavaScript
Go
REST

import time
from google import genai
from google.genai import types

client = genai.Client()

operation = client.models.generate_videos(
    model="veo-3.1-generate-preview",
    prompt="A cinematic shot of a majestic lion in the savannah.",
    config=types.GenerateVideosConfig(negative_prompt="cartoon, drawing, low quality"),
)

# Poll the operation status until the video is ready.
while not operation.done:
    print("Waiting for video generation to complete...")
    time.sleep(10)
    operation = client.operations.get(operation)

# Download the generated video.
generated_video = operation.response.generated_videos[0]
client.files.download(file=generated_video.video)
generated_video.video.save("parameters_example.mp4")
print("Generated video saved to parameters_example.mp4")
Veo 提示指南
本部分包含一些示例视频，展示了如何使用 Veo 创建视频，以及如何修改提示以生成不同的结果。

安全过滤器
Veo 会在 Gemini 中应用安全过滤条件，以帮助确保生成的视频和上传的照片不包含冒犯性内容。 违反我们条款和准则的提示会被屏蔽。

提示撰写的基础知识
好的提示应具有描述性且清晰明了。如要充分利用 Veo，请先确定核心创意，然后通过添加关键字和修饰符来完善创意，并在提示中加入视频专用术语。

您的提示应包含以下元素：

正文：您希望在视频中呈现的对象、人物、动物或场景，例如城市景观、自然、车辆或小狗。
动作：正文正在做的事情（例如，走路、跑步或转头）。
风格：使用特定的电影风格关键字（例如科幻、恐怖片、黑色电影）或动画风格关键字（例如卡通）指定创意方向。
相机定位和运动：[可选] 使用航拍、平视、俯拍、轨道拍摄或仰拍等术语控制相机的位置和运动。
构图：[可选] 拍摄镜头的构图方式，例如广角镜头、特写镜头、单人镜头或双人镜头。
对焦和镜头效果：[可选] 使用浅景深、深景深、柔焦、微距镜头和广角镜头等术语来实现特定的视觉效果。
氛围：[可选] 颜色和光线对场景的贡献，例如蓝色调、夜间或暖色调。
有关撰写提示的更多技巧
使用描述性语言：使用形容词和副词为 Veo 描绘清晰的画面。
增强面部细节：指定面部细节作为照片的焦点，例如在提示中使用“portrait”（人像）一词。
如需了解更全面的提示策略，请参阅提示设计简介。

提示用户输入音频
借助 Veo 3，您可以为音效、环境噪音和对话提供提示。 该模型会捕捉这些提示的细微差别，以生成同步的音轨。

对话：使用引号表示具体对话。（例如：“这一定是钥匙，”他低声说道。）
音效 (SFX)：明确描述声音。（示例：轮胎发出刺耳的尖叫声，发动机发出轰鸣声。）
环境噪音：描述环境的声景。（示例：背景中回荡着微弱而诡异的嗡嗡声。）
这些视频展示了如何通过提供越来越详细的提示来指导 Veo 3 生成音频。

提示	生成的输出
更多细节（对话和环境音）
一个广角镜头，拍摄的是雾气弥漫的太平洋西北森林。两名疲惫的徒步者（一男一女）在蕨类植物丛中艰难前行，突然，男士停下脚步，盯着一棵树。特写：树皮上留有新鲜的深爪印。男士：（手放在猎刀上）“那不是普通的熊。”Woman：（声音因恐惧而紧绷，目光扫视着树林）“那是什么？”粗糙的树皮、折断的树枝、潮湿泥土上的脚步声。一只孤零零的鸟在鸣叫。	两名在树林中的人员发现了熊的踪迹。
细节较少（对话）
剪纸动画。新图书管理员：“禁书放在哪里？”老馆长：“我们没有。他们会留着我们。”	动画图书管理员讨论禁书
不妨亲自尝试一下这些提示，听听音频效果！ 试用 Veo 3

使用参考图片进行提示
您可以利用 Veo 的图片转视频功能，使用一张或多张图片作为输入来引导生成的视频。Veo 会将输入图片用作初始帧。选择一张最接近您设想的视频第一幕的图片，为日常物品添加动画效果，让绘画作品更加生动，也可以为自然景观增添动感和声音。

提示	生成的输出
输入图片（由 Nano Banana 生成）
一张超写实的微距照片，画面中，微小的冲浪者在古朴的石制浴室水槽内乘风破浪。一个老式黄铜水龙头正在流水，营造出永恒的冲浪声。超现实、奇幻、明亮的自然光。	在简朴的石制浴室水槽中，微型冲浪者在海浪中冲浪。
输出视频（由 Veo 3.1 生成）
一段超现实的电影级微距视频。小小的冲浪者在石制浴室水槽内乘着永恒的滚滚浪花。一个正在运行的复古黄铜水龙头会产生无尽的冲浪。镜头缓慢平移，展示阳光明媚的奇幻场景，微型人物在蔚蓝的海水中熟练地雕刻。	在浴室水槽中，小小的冲浪者在波浪中环绕。
借助 Veo 3.1，您可以参考图片或素材来指导生成的视频内容。提供最多三张单个人物、角色或产品的素材资源图片。Veo 会在输出视频中保留主题的外观。

提示	生成的输出
参考图片（由 Nano Banana 生成）
一条深海安康鱼潜伏在深暗的水中，露出牙齿，鱼饵发出光芒。	一条深色发光安康鱼
参考图片（由 Nano Banana 生成）
一套粉色儿童公主服装，配有魔杖和皇冠，背景为纯色商品背景。	儿童粉色公主服装
输出视频（由 Veo 3.1 生成）
制作一个搞笑的卡通版鱼，让它穿着服装、游泳并挥舞魔杖。	一只穿着公主服装的安康鱼
使用 Veo 3.1，您还可以通过指定视频的第一帧和最后一帧来生成视频。

提示	生成的输出
第一张图片（由 Nano Banana 生成）
一张高质量的逼真正面图片，内容是一只姜黄色猫咪驾驶一辆红色敞篷赛车行驶在法国里维埃拉海岸。	一只姜黄色猫咪驾驶着一辆红色敞篷赛车
最后一张图片（由 Nano Banana 生成）
：显示汽车从悬崖上起飞时的情景。	一只姜黄色猫驾驶着一辆红色敞篷车冲下悬崖
输出视频（由 Veo 3.1 生成）
可选	一只猫从悬崖上开车起飞
借助此功能，您可以定义开始帧和结束帧，从而精确控制拍摄画面的构图。上传图片或使用之前生成的视频中的帧，确保场景的开头和结尾完全符合您的设想。

提示扩展
如需使用 Veo 3.1 延长 Veo 生成的视频，请将该视频用作输入内容，并提供可选的文本提示。“延长”功能会完成视频的最后一秒或 24 帧，并继续执行动作。

请注意，如果视频的最后 1 秒内没有声音，则无法有效地延长声音。

提示	生成的输出
输入视频（由 Veo 3.1 生成）
滑翔伞从山顶起飞，开始沿着山坡滑翔，俯瞰下方鲜花盛开的山谷。	滑翔伞从山顶起飞
输出视频（由 Veo 3.1 生成）
延长此视频，让滑翔伞缓慢下降。	滑翔伞从山顶起飞，然后缓慢下降
提示和输出示例
本部分提供了多个提示，重点介绍了描述性细节如何提升每个视频的效果。

冰柱
本视频演示了如何在提示中使用提示撰写基础知识中的元素。

提示	生成的输出
特写镜头（构图）：冰冻岩壁（背景）上融化的冰柱（正文），色调偏冷蓝（氛围），镜头拉近（相机运动），保持水滴（动作）的特写细节。	滴水的冰柱，背景为蓝色。
一位男士正在打电话
这些视频演示了如何通过添加越来越具体的细节来修改提示，让 Veo 将输出内容调整到您满意的程度。

提示	生成的输出
细节较少
镜头从远处推近，展现一位身着绿色风衣、神情绝望的男人。他正在用一部绿色霓虹灯照亮的转盘式壁挂电话拨号。看起来像电影场景。	男士正在打电话。
更多细节
一个电影特写镜头跟随着一位身着破旧绿色风衣、神情绝望的男人，他正在拨打安装在粗糙砖墙上的转盘式电话，周围笼罩着绿色霓虹灯的诡异光芒。镜头缓缓推进，显示出他下巴的紧张感，以及他努力拨打电话时脸上刻着的绝望。浅景深效果将焦点对准了他紧锁的眉头和黑色的拨号电话，模糊了背景，使其变成一片霓虹灯色彩和模糊的阴影，营造出一种紧迫感和孤立感。	一位男士正在打电话
雪豹
提示	生成的输出
简单提示：
一只毛皮像雪豹一样可爱的生物在冬季森林中行走，3D 卡通风格渲染。	雪豹无精打采。
详细提示：
创作一个简短的 3D 动画场景，采用欢快的卡通风格。一只可爱的生物，有着雪豹般的皮毛、富有表现力的大眼睛和圆润友好的身形，在奇幻的冬季森林中欢快地跳跃。场景中应有圆润的雪树、缓缓飘落的雪花，以及透过树枝的温暖阳光。生物的弹跳动作和灿烂的笑容应传达出纯粹的喜悦。采用欢快温馨的基调，搭配明快活泼的色彩和趣味十足的动画。	雪豹跑得更快了。
按写作要素划分的示例
以下示例展示了如何根据每个基本要素优化提示。

主题和背景
指定主要焦点（正文）和背景或环境（上下文）。

提示	生成的输出
一栋白色混凝土公寓楼的建筑效果图，具有流畅的有机形状，与茂盛的绿色植物和未来派元素无缝融合	占位符。
一颗卫星在太空中漂浮，背景是月球和一些星星。	漂浮在大气层中的卫星。
操作
指定拍摄对象正在做什么（例如，走路、跑步或转头）。

提示	生成的输出
广角镜头：一位女性在海滩上行走，在日落时分面朝地平线，看起来很满足和放松。	日落美景令人惊叹。
样式
添加关键字，引导生成器朝着特定美学风格（例如超现实主义、复古、未来主义、黑色电影）生成图片。

提示	生成的输出
黑色电影风格，一男一女走在街上，神秘、电影感、黑白。	黑色电影风格绝对美轮美奂。
相机运动和构图
指定镜头的拍摄方式（第一人称视角、鸟瞰图、跟踪无人机视角）和取景方式（广角镜头、特写镜头、低角度）。

提示	生成的输出
第一人称视角镜头：一辆复古汽车在雨中行驶，加拿大夜景，电影风格。	日落美景令人惊叹。
眼睛的超近特写，眼睛中映出城市。	日落美景令人惊叹。
气氛
色彩和光线会影响情绪。您可以尝试使用“柔和的橙色暖色调”“自然光”“日出”或“冷色调蓝色”等字词。

提示	生成的输出
在阳光明媚的公园里，一个女孩抱着可爱的金毛猎犬小狗的特写镜头。	一只小狗在一位年轻女孩的怀里。
电影般的特写镜头：一位悲伤的女性在雨中乘坐公交车，画面采用冷色调蓝色，营造出悲伤的氛围。	一位女士坐在公交车上，看起来很伤心。
否定提示
反向提示用于指定您不希望视频中包含的元素。

❌ 请勿使用“没有”或“不”等指令性语言。（例如 “无墙”）。
✅ 请描述您不想看到的内容。（例如 “墙、框架”）。
提示	生成的输出
不使用否定提示：
生成一段简短的风格化动画，内容是一棵巨大的孤零零的橡树，树叶在强风中剧烈摇摆……[截断]	使用文字的树。
使用负面提示：
[相同提示]

负面提示：城市背景、人造结构、黑暗、暴风雨或威胁性氛围。	不含否定词的树。
宽高比
您可以使用 Veo 指定视频的宽高比。

提示	生成的输出
宽屏 (16:9)
制作一段视频，内容为：一架跟踪无人机拍摄的画面，显示一名男子在 20 世纪 70 年代的棕榈泉驾驶一辆红色敞篷车，阳光温暖，阴影拉长。	一名男子驾驶一辆红色敞篷车在棕榈泉行驶，风格为 20 世纪 70 年代。
纵向 (9:16)
制作一段视频，突出展示茂密热带雨林中壮丽的夏威夷瀑布的流畅动态。重点呈现逼真的水流、细致的树叶和自然的光线，以营造宁静的氛围。捕捉湍急的水流、雾气弥漫的氛围，以及透过茂密树冠的斑驳阳光。使用流畅的电影级镜头移动来展示瀑布及其周围环境。力求营造宁静而真实的氛围，让观看者仿佛置身于夏威夷热带雨林的宁静美景之中。	夏威夷雨林中壮丽的瀑布。
限制
请求延迟时间：最短：11 秒；最长：6 分钟（高峰时段）。
地区限制：在欧盟、英国、瑞士、中东和北非地区，personGeneration 的允许值为：
Veo 3：仅限 allow_adult。
Veo 2：dont_allow 和 allow_adult。默认值为 dont_allow。
视频保留期限：生成的视频会在服务器上存储 2 天，之后会被移除。如需保存本地副本，您必须在视频生成后的 2 天内下载视频。扩展视频会被视为新生成的视频。
添加水印：Veo 制作的视频会使用 SynthID（我们的 AI 生成内容水印添加和识别工具）添加水印。您可以使用 SynthID 验证平台来验证视频。
安全性：生成的视频会通过安全过滤和记忆检查流程，有助于降低隐私、版权和偏见风险。
音频错误：由于安全过滤条件或音频的其他处理问题，Veo 3.1 有时会阻止视频生成。如果您的视频无法生成，我们不会向您收取费用。
模型功能
功能	说明	Veo 3.1 和 Veo 3.1 Fast	Veo 3 和 Veo 3 Fast	Veo 2
音频	原生生成包含音频的视频。	原生生成包含音频的视频。	✔️ 始终开启	❌ 仅限静音
输入模态	用于生成的输入类型。	文生视频、图生视频、视频转视频	文生视频、图生视频	文生视频、图生视频
解决方法	视频的输出分辨率。	720p 和 1080p（仅限 8 秒时长）

使用视频扩展广告时仅限 720p。	720p 和 1080p（仅限 16:9）	720p
帧速率	视频的输出帧速率。	24 帧/秒	24 帧/秒	24 帧/秒
视频时长	生成的视频的时长。	8 秒、6 秒、4 秒
仅在使用参考图片时为 8 秒	8 秒	5-8 秒
每个请求的视频数量	每个请求生成的视频数量。	1	1	1 或 2
状态和详细信息	型号供应情况和更多详细信息。	预览	稳定版	稳定版
模型版本
如需详细了解特定于 Veo 模型的用量，请参阅价格和速率限制页面。

Veo 3.1 预览版
属性	说明
 模型代码
Gemini API

veo-3.1-generate-preview

支持的数据类型
输入

文字、图片

输出

带音频的视频

限制
文本输入

1,024 个 token

输出视频

1

最新更新	2025 年 9 月
Veo 3.1 Fast 预览版
属性	说明
 模型代码
Gemini API

veo-3.1-fast-generate-preview

支持的数据类型
输入

文字、图片

输出

带音频的视频

限制
文本输入

1,024 个 token

输出视频

1

最新更新	2025 年 9 月
Veo 3
属性	说明
 模型代码
Gemini API

veo-3.0-generate-001

支持的数据类型
输入

文字、图片

输出

带音频的视频

限制
文本输入

1,024 个 token

输出视频

1

最新更新	2025 年 7 月
Veo 3 Fast
Veo 3 Fast 可让开发者创作有声视频，同时保持高画质并优化速度和业务用例。它非常适合用于以编程方式生成广告的后端服务、用于快速对广告素材概念进行 A/B 测试的工具，或需要快速制作社交媒体内容的应用。
属性	说明
 模型代码
Gemini API

veo-3.0-fast-generate-001

支持的数据类型
输入

文字、图片

输出

带音频的视频

限制
文本输入

1,024 个 token

输出视频

1

最新更新	2025 年 7 月
Veo 2
属性	说明
 模型代码
Gemini API

veo-2.0-generate-001

支持的数据类型
输入

文字、图片

输出

视频

限制
文本输入

不适用

图片输入

任意分辨率和宽高比，文件大小不超过 20MB

输出视频

最多 2 个

最新更新	2025 年 4 月
后续步骤
您可以尝试使用 Veo 快速入门 Colab 和 Veo 3.1 applet，开始使用 Veo 3.1 API。
不妨参阅我们的提示设计简介，了解如何撰写更好的提示。