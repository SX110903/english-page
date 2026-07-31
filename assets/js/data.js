/* ==========================================================================
   data.js — every piece of exercise content lives here.
   Adding a question or a new game round means editing this file only.
   ========================================================================== */

window.LC = window.LC || {};

LC.data = {
  /* hero: vocabulary that orbits the console */
  heroWords: [
    { en: 'confident', zh: '自信的', ipa: '/ˈkɑːnfɪdənt/' },
    { en: 'weekend', zh: '周末', ipa: '/ˈwiːkend/' },
    { en: 'actually', zh: '其实', ipa: '/ˈæktʃuəli/' },
    { en: 'favorite', zh: '最喜欢的', ipa: '/ˈfeɪvərɪt/' },
    { en: 'nervous', zh: '紧张的', ipa: '/ˈnɜːrvəs/' },
    { en: 'practice', zh: '练习', ipa: '/ˈpræktɪs/' }
  ],

  /* hero: the console types through these */
  heroLines: [
    { who: 'Teacher', en: 'How was school today?', zh: '今天在学校过得怎么样？' },
    { who: 'Student', en: 'It was great! We had a science test.', zh: '很好！我们考了科学。' },
    { who: 'Teacher', en: 'Nice — tell me one thing you learned.', zh: '不错，说一件你学到的事。' }
  ],

  /* the guided lesson demo */
  lesson: {
    opening: [
      { who: 'Teacher', en: 'How was school today?', zh: '今天在学校过得怎么样？' },
      { who: 'Student', en: 'It was great!', zh: '挺好的！' },
      { who: 'Teacher', en: 'Nice! Tell me one thing you learned.', zh: '很好！说说你学到的一件事。' }
    ],
    replies: [
      {
        en: 'I learned how volcanoes erupt.',
        zh: '我学了火山是怎么喷发的。',
        ok: true,
        title: '很自然的回答',
        note: '结构完整，时态正确。老师接下来会顺着这个话题追问，让你把一句话变成一段话。',
        next: { en: 'Cool! What makes them erupt?', zh: '有意思！那是什么让它们喷发的呢？' }
      },
      {
        en: 'I learn how volcano erupt.',
        zh: '（时态与单复数需要调整）',
        ok: false,
        title: '意思懂了，我们把它说得更准',
        note: '过去发生的事要用过去式 learned；volcano 这里指“火山（们）”，用复数 volcanoes。',
        fix: 'I learned how volcanoes erupt.',
        next: { en: 'Good try — say it once more with me.', zh: '说得不错，跟我再说一遍。' }
      },
      {
        en: 'Yesterday I go to science and volcano.',
        zh: '（语序需要重新组织）',
        ok: false,
        title: '先把动作说清楚',
        note: '句子缺少一个明确的动词结构。先说“我学了什么”，再补充细节，句子就立起来了。',
        fix: 'Yesterday I learned about volcanoes in science class.',
        next: { en: 'Let\'s build it together, step by step.', zh: '我们一步一步来搭这个句子。' }
      }
    ]
  },

  /* method: five phases, drives the animated figure */
  method: [
    { zh: '听懂', en: 'Listen', hue: 214, bars: [0.3, 0.5, 0.9, 0.4, 0.2], text: '先让耳朵习惯真实语速的美式英语，不靠逐字翻译也能抓住意思。' },
    { zh: '模仿', en: 'Imitate', hue: 224, bars: [0.5, 0.8, 0.6, 0.8, 0.5], text: '跟读完整句子，连读、重音、语调一起模仿，而不是单个单词分开念。' },
    { zh: '开口', en: 'Speak', hue: 250, bars: [0.8, 0.4, 0.9, 0.6, 0.85], text: '在真实话题里表达自己的想法，允许出错，先把话说出来。' },
    { zh: '纠正', en: 'Correct', hue: 28, bars: [0.6, 0.9, 0.5, 0.9, 0.6], text: '针对当下这句话给出具体反馈，改哪里、为什么改，一次只解决一个问题。' },
    { zh: '自然表达', en: 'Express', hue: 38, bars: [0.9, 0.75, 0.95, 0.8, 0.9], text: '把学过的结构用进新的场景，慢慢变成不用想就能说出口的表达。' }
  ],

  /* five learning areas */
  skills: [
    {
      en: 'Speaking', zh: '口语表达',
      text: '围绕孩子真实的生活话题练习成段表达，从一句话到一分钟。',
      sample: { en: 'Tell me about your favorite class.', zh: '说说你最喜欢的一门课。' },
      bars: [0.9, 0.6, 0.85, 0.7, 0.95]
    },
    {
      en: 'Listening', zh: '听力理解',
      text: '用正常语速的美式英语输入，练习抓关键信息，而不是逐词翻译。',
      sample: { en: 'What did she say about the weekend?', zh: '她关于周末说了什么？' },
      bars: [0.4, 0.8, 0.5, 0.9, 0.45]
    },
    {
      en: 'Pronunciation', zh: '发音语音',
      text: '重点处理中国学生常见的音：词尾辅音、长短元音、连读与重音。',
      sample: { en: 'ship / sheep — /ɪ/ 与 /iː/ 的区别', zh: '短元音与长元音' },
      bars: [0.7, 0.9, 0.6, 0.75, 0.8]
    },
    {
      en: 'Vocabulary', zh: '词汇运用',
      text: '把单词放回句子和场景里记，学会在对话中用出来，而不是只认识。',
      sample: { en: 'I felt confident about the test.', zh: '我对这次考试挺有信心。' },
      bars: [0.6, 0.7, 0.9, 0.5, 0.7]
    },
    {
      en: 'Grammar', zh: '语法体系',
      text: '把语法讲成能直接用的规则，同时服务于考试得分和自如表达。',
      sample: { en: 'I have finished my homework.', zh: '现在完成时：动作对现在的影响' },
      bars: [0.5, 0.6, 0.7, 0.85, 0.6]
    }
  ],

  /* ---------------- mini-game content ---------------- */

  /* 1. sentence builder */
  sentences: [
    {
      words: ['How', 'was', 'school', 'today'],
      answer: 'How was school today',
      zh: '今天在学校过得怎么样？',
      tip: '英语特殊疑问句的顺序：疑问词 + be动词 + 主语 + 时间。'
    },
    {
      words: ['I', 'went', 'to', 'the', 'park'],
      answer: 'I went to the park',
      zh: '我去了公园。',
      tip: 'go 的过去式是 went；地点前别丢掉 to 和 the。'
    },
    {
      words: ['What', 'do', 'you', 'usually', 'do', 'on', 'weekends'],
      answer: 'What do you usually do on weekends',
      zh: '你周末通常做什么？',
      tip: '频率副词 usually 放在主语之后、实义动词之前。'
    },
    {
      words: ['She', 'has', 'lived', 'here', 'for', 'two', 'years'],
      answer: 'She has lived here for two years',
      zh: '她在这儿住了两年了。',
      tip: '现在完成时 + for + 一段时间，表示持续到现在。'
    }
  ],

  /* 2. multiple choice */
  quiz: [
    {
      who: 'Teacher',
      say: 'What did you do this weekend?',
      zh: '这个周末你做了什么？',
      options: [
        { en: 'I went to the park.', ok: true },
        { en: 'I am park yesterday.', ok: false },
        { en: 'I go yesterday park.', ok: false }
      ],
      note: '问句用了 did，回答要用过去式 went。第二、三个选项缺少正确的动词和语序。'
    },
    {
      who: 'Teacher',
      say: 'Have you finished your homework?',
      zh: '你写完作业了吗？',
      options: [
        { en: 'Yes, I have.', ok: true },
        { en: 'Yes, I did finish it already now.', ok: false },
        { en: 'Yes, I am finish.', ok: false }
      ],
      note: 'Have you…? 的简短回答直接用 Yes, I have. 简洁又自然。'
    },
    {
      who: 'Teacher',
      say: 'How often do you practice English?',
      zh: '你多久练一次英语？',
      options: [
        { en: 'About three times a week.', ok: true },
        { en: 'I practice very much time.', ok: false },
        { en: 'Three time in one week always.', ok: false }
      ],
      note: '表示频率用 “… times a week”，注意 times 要用复数。'
    },
    {
      who: 'Teacher',
      say: 'What are you going to do tomorrow?',
      zh: '你明天打算做什么？',
      options: [
        { en: 'I\'m going to visit my grandparents.', ok: true },
        { en: 'I will visited my grandparents.', ok: false },
        { en: 'I go to visit grandparents tomorrow will.', ok: false }
      ],
      note: 'be going to + 动词原形，表示已经计划好的事。'
    }
  ],

  /* 3. vocabulary rush */
  vocab: [
    { en: 'confident', ipa: '/ˈkɑːnfɪdənt/', answer: '自信的', options: ['自信的', '疲惫的', '安静的', '困难的'] },
    { en: 'curious', ipa: '/ˈkjʊriəs/', answer: '好奇的', options: ['好奇的', '生气的', '无聊的', '准时的'] },
    { en: 'improve', ipa: '/ɪmˈpruːv/', answer: '提高', options: ['提高', '忘记', '推迟', '假装'] },
    { en: 'polite', ipa: '/pəˈlaɪt/', answer: '有礼貌的', options: ['有礼貌的', '粗心的', '拥挤的', '昂贵的'] },
    { en: 'decide', ipa: '/dɪˈsaɪd/', answer: '决定', options: ['决定', '借出', '重复', '收集'] },
    { en: 'nervous', ipa: '/ˈnɜːrvəs/', answer: '紧张的', options: ['紧张的', '骄傲的', '幸运的', '安全的'] }
  ],

  /* 4. listening cloze */
  listening: [
    { full: 'I usually walk to school with my sister.', gap: 'walk', options: ['walk', 'work', 'wake', 'watch'], zh: '我通常和妹妹一起走路去上学。' },
    { full: 'She was really excited about the trip.', gap: 'excited', options: ['excited', 'exciting', 'exited', 'expected'], zh: '她对这次旅行非常兴奋。' },
    { full: 'Could you say that again, please?', gap: 'again', options: ['again', 'against', 'ago', 'agree'], zh: '你可以再说一遍吗？' },
    { full: 'We are going to practice speaking today.', gap: 'practice', options: ['practice', 'practical', 'promise', 'produce'], zh: '我们今天要练习口语。' }
  ],

  /* encouragement shown in the progress rail */
  cheers: [
    '开始了就是最好的一步。',
    '答对了，这个结构记住了。',
    '连续答对，语感在起作用。',
    '错了也没关系，知道为什么就够了。',
    '保持这个节奏，很稳。',
    '这一轮完成了，做得不错。'
  ]

  /* FAQ lives directly in index.html so search engines read it without JS. */
};
