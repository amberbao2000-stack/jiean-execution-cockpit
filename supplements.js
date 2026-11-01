// v1.2 近期新增原话。只扩充执行导航及可追溯原话；不改写原 Word，不新增日程。
// 引文由用户在本次对话中提供，日期未指定；P8001/P8002 是扩展内容的虚拟定位编号。
import {SECTIONS, ORIGINAL_PARAGRAPHS, CORE_1007, REALITY_ITEMS} from './content.js';

const addedSections = [
  {
    "id": "added-ai-learning",
    "title": "近期新增原话｜AI、学习与回到正道",
    "page": "本次对话提供 · 非原 Word",
    "start": 8001,
    "end": 8001
  },
  {
    "id": "added-relationships",
    "title": "近期新增原话｜慕强、喜欢与亲密关系",
    "page": "本次对话提供 · 非原 Word",
    "start": 8002,
    "end": 8002
  }
];
const addedParagraphs = [
  {
    "p": 8001,
    "text": "我觉得这不是个非此即彼的问题吧。\n用AI->让自己更好学得会东西\n用AI->只为了交作业\n用AI->达到优绩主义->让自己在意识形态中显得有价值\n用AI->让自己成为一个，不会被意识形态困住的真正有用之人\n我觉得这些是容易被混淆的。\n\n如果从务实的角度来讲，我上次交代你的，就是回到正道，学到点东西。关键是，学到东西，以及回到正道。关键又不是你作业要多少分、gpa要如何如何。\n真正决定你是不是朝着，你希望的更自由、更舒服的境界去走，关键从来不是过程里面你是手搓还是用ai。关键在于，你完成这个任的过程，以及后续腾出来的时间，是拿来更加理解教育？还是说，让自己赶紧完成任务满分交差？\n说简单点，用不用ai，都面临这个问题：过程中，我是否更加理解教育了？还是说，我只是希望有个结果能交差上去？\n有问题的从来不是工具，而是人的追求，以及因追求不同，而导致过程和姿态有所不同。\n假设：AI如果让我变懒变蠢，但让我对教育有了更加深刻和感性的体验，那用不用？假设牺牲我一个人的智力，能让更多人得到更好的教育，我能不能接受？\n所以，其实本来就没有标准答案，是绩优主义，让你们觉得，必须有标准答案。\n\n\n说得更务虚一点，你可以琢磨这个问题：\n用AI对不对？怎么用AI才是对、怎样才是错？强制自己必须找到这个问题的答案，难道不是一种优绩主义驱动的自我审视吗？",
    "section": "added-ai-learning"
  },
  {
    "p": 8002,
    "text": "这是很普遍的慕强心态吧。还是回到原来教过你的问题：爱、喜欢、性、执念，是4个不同的要素。\n慕强，有认知精神的被碾压感，可以是一种爽感。但是喜欢，不一定需要这种被碾压感。\n慕强，我一般归类到喜欢里面。\n但喜欢，不需要和慕强挂钩。\n可以给你一点小技巧：diy完，在咸鱼模式下看这个问题，可能会有不同的答案。先撇除掉性的影响。\n我觉得这个也是绩优主义的其中一些影响，似乎认知和精神的强，就是最重要的。我倒不觉得，这就是全貌。实际上，两性关系里面，有太多太多的维度了。等你安顿下来，走回正道，安放掉学业焦虑之后，也许你接触不同类型的男性后，可能就会更加理解这个问题",
    "section": "added-relationships"
  }
];
const addedCore = [
  {
    "id": "added-ai-learning",
    "title": "近期补充｜AI、学习与回到正道",
    "core": "关键是，学到东西，以及回到正道。",
    "when": "使用 AI 学习或做作业时，纠结工具的“对错”、作业分数、GPA，或者自己是否只在追求交差时。",
    "sourceP": 8001,
    "sourceLabel": "本次对话新增原话｜AI、学习与回到正道（非原 Word）"
  },
  {
    "id": "added-relationships",
    "title": "近期补充｜慕强、喜欢与亲密关系",
    "core": "爱、喜欢、性、执念，是4个不同的要素。",
    "when": "把慕强、认知精神上的“被碾压感”和喜欢混在一起，或想判断自己对一个人的感受时。",
    "sourceP": 8002,
    "sourceLabel": "本次对话新增原话｜慕强、喜欢与亲密关系（非原 Word）"
  }
];
const addedReality = [
  {
    "id": "added-ai-in-life",
    "title": "AI 与学习｜做作业、理解教育",
    "scene": "AI 使用 / 学习 / 教育",
    "short": "用不用 AI 都可以留意：过程中是否更加理解教育，还是只希望得到能交差的结果。",
    "sourceP": 8001
  },
  {
    "id": "added-relationship-in-life",
    "title": "慕强与喜欢｜辨认关系感受",
    "scene": "关系 / 慕强 / 喜欢",
    "short": "区分爱、喜欢、性、执念；慕强可以归在喜欢里，但喜欢不一定需要慕强。",
    "sourceP": 8002
  }
];

for (const section of addedSections) {
  if (!SECTIONS.some(x => x.id === section.id)) SECTIONS.push(section);
}
for (const p of addedParagraphs) {
  if (!ORIGINAL_PARAGRAPHS.some(x => x.p === p.p)) ORIGINAL_PARAGRAPHS.push(p);
}
for (const item of addedCore) {
  if (!CORE_1007.some(x => x.id === item.id)) CORE_1007.push(item);
}
for (const item of addedReality) {
  if (!REALITY_ITEMS.some(x => x.id === item.id)) REALITY_ITEMS.push(item);
}

// 原话中的换行与空行须按提供时的样子呈现，不能挤成一段。
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = '#src-p8001, #src-p8002 { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.85; }';
  document.head.appendChild(style);
}
