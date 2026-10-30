/* ============================================================================
 * i18n.cjs — DISPLAY localization for code-managed ENUM values.  v3.20
 *
 * CONTRACT: storage + engine code ALWAYS hold the English KEY (Mood="Playful",
 * Weather="Clear", RelationshipStage="Friend"). This table maps a key -> a
 * per-language display LABEL, applied ONLY at player-facing edges (the stat-menu
 * panel + the chat status bar). The narrator localizes prose on its own from the
 * key, so Window-A does NOT use this.
 *
 * WHICH LANGUAGE: Preferences.Lang (seeded in initmvu.json). Any lang without a
 * block here — or any key missing from a block — FALLS BACK to the English key
 * itself (labelOf returns `key`). So `en` needs no table, and a partial
 * translation degrades gracefully.
 *
 * TO ADD A LANGUAGE: add a top-level block mirroring 'zh-TW' (only the keys you
 * want translated; the rest fall back to English). No code change anywhere.
 *
 * Loaded two ways from ONE source: Node `require` (resolver + tests) and, in the
 * baked stat-menu, a wire_resolver prelude that runs this file so it sets
 * globalThis.__I18N_API__ (globalLogic reads that when require is unavailable).
 * ========================================================================== */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;   // Node (globalLogic + tests)
  if (root && typeof root === 'object') root.__I18N_API__ = api;               // browser (menu prelude)
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // key -> display label, per language. Keys are the ENGLISH values the engine writes.
  var I18N = {
    'zh-TW': {
      weather: { Clear: '晴朗', Rain: '雨天', Fog: '濃霧', Storm: '雷雨' },
      mood: {
        Neutral: '平靜', Happy: '開心', Playful: '俏皮', Loving: '深情', Embarrassed: '害羞',
        Irritated: '煩躁', Anxious: '不安', Excited: '興奮', Sad: '難過', Angry: '生氣',
      },
      // shared by Embarrassment AND Guilt (the none/low/mid/high/very high bucket)
      bucket: { none: '無', low: '低', mid: '中', high: '高', 'very high': '極高' },
      stage: {
        Stranger: '陌生人', Acquaintance: '相識', Friend: '朋友', Dating: '交往',
        Girlfriend: '女朋友', Estranged: '疏遠',
        Friends_With_Benefits: '炮友', Loyal_Puppy: '性奴',
      },
      mode: { SCHOOL: '上學日', OPEN: '自由日' },
      status: { 'On-going': '進行中', Completed: '已完成' },
      // PHRASE table — free-prose engine strings (EventPack fx: quest fields, World Log summaries,
      // registry labels). Keyed by the FULL ENGLISH STRING (the authored set is finite — every string
      // comes verbatim from the trigger table); a missing entry falls back to the English text itself.
      // ADD A ROW HERE whenever you author a new event's fx prose.
      phrase: {
        'GameEvent': '遊戲事件',
        'done': '已觸發', 'arc': '本輪', 'save': '永久',
        'Unknown': '未知',
        'Goddess of Love & Lust': '愛與慾之女神',
        'A goddess from another world has taken an interest in your love life.':
          '一位來自異世界的女神對你的感情生活產生了興趣。',
        'Return to the Ancient Ruins after 16:00 to meet Leila again.':
          '16:00後再次前往古代遺跡與Leila見面。',
        'Met Leila at the ruins; she hinted at a blessing or a test.':
          '在遺跡遇見了Leila；她暗示將給予祝福——或是考驗。',
        "Keep your side of Leila's bargain — come back to the Ancient Ruins 1 week later after 16:00 and talk to her.":
          '履行與Leila的約定——一週後16:00回到古代遺跡陪她說話。',
        'Struck a bargain with Leila: she made you more charming, and you owe her your company.':
          '與Leila立下了契約：她讓你更有魅力，而你欠她陪伴。',
        'Cha +5, and a goddess who expects visitors': '魅力+5，以及一位期待訪客的女神',
        'Met Leila, the Goddess of Love & Lust (a crossover deity), at the Ancient Ruins; she hinted she may bless — or test — his love life.':
          '在古代遺跡遇見了愛與慾之女神Leila（異界神祇）；她暗示可能會祝福——或考驗——他的感情生活。',
        "Leila's bargain at the Ancient Ruins: a little of her charm, in exchange for {{user}}'s company.":
          'Leila在古代遺跡與{{user}}立下契約：分她一點魅力，換他的陪伴。',
        'Bring your first girlfriend to the Ancient Ruins after 16:00 and show her to Leila.':
          '16:00後帶你的第一位女友前往古代遺跡，讓Leila看看她。',
        'Leila revealed what she is and what she wants to watch: a harem, and the first girl brought to her.':
          'Leila揭露了自己的身分與想看的東西：一個後宮，以及第一位被帶到她面前的女孩。',
        'A blessing for whoever you bring - if her mood holds':
          '給你帶來的那個女孩一份祝福——看她當天的心情',
        'Leila named herself the Goddess of Love & Lust at the Ancient Ruins, told {{user}} to chase more girls, and asked to be shown his first girlfriend.':
          'Leila在古代遺跡自稱愛與慾之女神，要{{user}}多去追求女孩，並要他帶第一位女友來見她。',
        'Return to the Ancient Ruins alone after 16:00, one week from now.':
          '一週後16:00獨自前往古代遺跡。',
        'Leila questioned the girl you brought, blessed her, and took the memory back - she is still yours alone to know.':
          'Leila盤問了你帶去的女孩，給了她祝福，再把記憶收回——她依然只有你認識。',
        'Your girlfriend left changed, and does not remember why':
          '你的女友被改變了，卻不記得為什麼',
        'Leila interrogated the girl {{user}} brought to the ruins about why she wants him, laughed, blessed her, and wiped her memory of the meeting.':
          'Leila盤問{{user}}帶到遺跡的女孩為何喜歡他，大笑之後給了她祝福，並抹去了她這段記憶。',
        'Buy Leila a pink underwear set, then bring it to the Ancient Ruins after 16:00, earliest is a week from now.':
          '為Leila買一套粉紅色內衣，最早一週後、16:00之後帶到古代遺跡。',
        'Leila wants a pink bra and panties and cannot buy them herself - she has no money in this world.':
          'Leila想要一套粉紅色的胸罩與內褲，卻無法自己去買——她在這個世界沒有錢。',
        'First to see a goddess wearing what you bought her':
          '成為第一個看見女神穿上你買的東西的人',
        'Leila asked {{user}} to buy her a pink bra and panties - she has never worn a set and has no money in this world.':
          'Leila要{{user}}為她買一套粉紅色的胸罩與內褲——她從未穿過，而且在這個世界沒有錢。',
        'You bought her the set and she wore it in front of you, then hinted at what a good boy might be allowed next.':
          '你買下了那套內衣，她當著你的面穿上，還暗示乖孩子下次也許能得到什麼。',
        'She hinted at what comes next, if you behave':
          '她暗示了下一步——如果你夠乖的話',
        'Leila took the pink underwear set {{user}} brought her, put it on in front of him, and told him to come back alone in a week.':
          'Leila收下{{user}}帶來的粉紅色內衣，當著他的面穿上，並要他一週後獨自再來。',
        'Return to the Ancient Ruins alone after 19:00, one week from now.':
          '一週後19:00之後獨自前往古代遺跡。',
        'Return to the Ancient Ruins after 19:00, one month (30 days) from now.':
          '一個月（30天）後的19:00之後前往古代遺跡。',
        'She swam in the set at the school pool after dark, put your hand on her chest, and gave you a month to think about it.':
          '她在天黑後的學校泳池穿著那套內衣游泳，把你的手放到她胸上，再給你一個月去想。',
        'She let you touch her, and promised nothing':
          '她讓你碰了她，卻什麼也沒答應',
        'She knocked you flat without warning, said she likes stronger men, and drilled you in hand-to-hand until eleven at night.':
          '她二話不說就把你打倒，說她喜歡更強的男人，然後操練你肉搏到晚上十一點。',
        'Her drilling left you measurably stronger':
          '她的操練讓你實實在在地變強了',
        'Leila attacked {{user}} at the ruins without a word, put him down, then drilled him in hand-to-hand until 23:00 and left for another month.':
          'Leila在遺跡不發一語就向{{user}}動手，把他打倒，接著操練他肉搏到晚上23:00，再消失一個月。',
        'Next Door, Always':
          '隔壁的她，一直都在',
        'Mitsuki has lived next door your whole life. You read every new classmate like a case file — and you have never once read her.':
          '美月從小就住在你隔壁。你把每個新同學都當成案件檔案來讀——卻從來沒有讀過她。',
        'Mitsuki had {{user}} rank twelve prototype cookies from the tin, wrote his verdicts inside its lid, and ate the folded paper baked into cookie nine before he could read it.':
          '美月讓{{user}}替罐子裡的十二塊試作餅乾排名，把他的評語寫在罐蓋內側，還在他讀到之前就把烤進第九塊餅乾裡的摺紙吃了下去。',
        'Mitsuki has founded a detective agency, and you are its only assistant. The shoe lockers, after class.':
          '美月成立了一間偵探社，而你是唯一的助手。放學後，鞋櫃。',
        'Twelve cookies, one honest ranking, written inside a lid that holds thirteen years of your rankings. And one folded paper she ate before you could read it.':
          '十二塊餅乾、一次誠實的排名，寫在一個收著你十三年排名的罐蓋內側。還有一張她在你讀到之前就吃掉的摺紙。',
        'One more row in thirteen years of rankings':
          '十三年的排名裡，又多了一行',
        'Mitsuki founded a detective agency to catch the shoe-locker ghost, made {{user}} her assistant, and caught nobody; he read the clues, worked out the ghost was her, and said nothing.':
          '美月成立偵探社要抓鞋櫃幽靈，任命{{user}}當助手，結果誰也沒抓到；他讀懂了線索，推理出幽靈就是她，卻什麼也沒說。',
        'Mitsuki booked karaoke for "the class" this weekend. Go. You are the class.':
          '美月幫「全班」訂了這週末的卡拉OK。去吧。全班就是你。',
        'A stakeout, a suspect board with every name but one, and a note on baking parchment in a right hand writing left-handed. You know who the ghost is. You did not say.':
          '一場埋伏、一張只少了一個名字的嫌疑人板，還有一張寫在烘焙紙上、由右撇子用左手寫成的紙條。你知道幽靈是誰。你沒有說。',
        'A case solved, and kept to yourself':
          '一件破了的案子，你只留給了自己',
        'Mitsuki booked a karaoke booth for a class outing of two, sang every anime opening in order, blackmailed {{user}} into a duet, set the 100-point screenshot as her lock screen, and paid for everything before he could reach the till.':
          '美月替一場只有兩個人的班級出遊訂了卡拉OK包廂，按順序唱完所有動畫主題曲，威脅{{user}}合唱，把100分的截圖設成鎖定畫面，還在他走到櫃檯之前就付清了所有費用。',
        'The ghost\'s notes are always in the lockers before anyone is in. Be at the shoe lockers first thing on a school day.':
          '幽靈的紙條總是在所有人到校之前就放進鞋櫃了。上學日一早，到鞋櫃去。',
        'Ninety minutes of anime openings, one duet under duress, a perfect score on her lock screen. She paid for all of it before you could reach the till.':
          '九十分鐘的動畫主題曲、一次被脅迫的合唱、一個放在她鎖定畫面上的滿分。在你走到櫃檯之前，她已經全部付清了。',
        'Her lock screen is the two of you':
          '她的鎖定畫面是你們兩個',
        'Found at the shoe lockers first thing by {{user}}, who only said good morning, Mitsuki could not lie about why she was there and made her alibi true: she planted a watermelon in the gardening committee\'s pansy bed on the spot, with him digging.':
          '一早在鞋櫃前被只說了聲早安的{{user}}撞見，美月無法對自己為何在那裡說謊，只好讓不在場證明成真：她當場把西瓜種進園藝委員的三色堇花壇，由他負責挖土。',
        'Mitsuki says she made too much dinner. Go to her apartment after 19:00.':
          '美月說她晚餐煮太多了。19:00以後去她家。',
        'You said only "morning". She said "the garden", then had to make it true: one watermelon in the pansy bed, a committee girl, a wheelbarrow, an oath on the tin. She cannot lie. You will not ask her anything straight again.':
          '你只說了「早安」。她說「花園」，然後只好讓它成真：三色堇花壇裡的一顆西瓜、一位園藝委員、一台手推車、一個對著餅乾罐發的誓。她不會說謊。你再也不會直接問她任何事了。',
        'An alibi made true, and a watermelon to show for it':
          '一個成真的不在場證明，外加一顆西瓜作證',
        'Mitsuki had {{user}} over for a dinner she made too much of, in an apartment with two of everything and one of her; the ghost\'s pens were on her counter, and the smile slipped once.':
          '美月煮了太多晚餐，請{{user}}到一間什麼都有兩份、人只有一個的公寓吃飯；幽靈的筆就擺在她的流理台上，笑容滑落了一次。',
        'Her water heater died. The bathhouse, this weekend, and heaven help you.':
          '她家的熱水器壞了。這週末去澡堂，願老天保佑你。',
        'Dinner for two in an apartment built for three. She talked the whole time. Once, for a second, she did not. In all the time you have known her, she has never once said she is fine.':
          '在一間為三個人建的公寓裡的兩人晚餐。她全程都在說話。有一秒鐘，她沒有。你認識她這麼久，她從來沒有說過一次「我很好」。',
        'Leftovers, and a sentence she has never once said':
          '剩菜，以及一句她從來沒說過的話',
        'Mitsuki narrated {{user}}\'s whole childhood through the bathhouse wall and got louder when he stopped answering; asked by an old woman who was waiting at home for her, she went silent for four seconds.':
          '美月隔著澡堂的牆講完{{user}}的整個童年，他一不回話她就講得更大聲；當一位老太太問她家裡有誰在等她時，她沉默了四秒。',
        'Check your shoe locker in the morning. Then find her on the rooftop at lunch.':
          '早上先看看你的鞋櫃。然後午休去屋頂找她。',
        'The whole bathhouse knows about the frog now. You stopped answering and she got louder. Asked if you were her boy, she changed the subject. Asked who waits at home for her, she said nothing at all, for four seconds.':
          '整間澡堂現在都知道青蛙的事了。你不回話，她就講得更大聲。被問到你是不是她的男朋友，她轉移了話題。被問到家裡有誰在等她，她什麼也沒說，整整四秒。',
        'Four seconds you will not forget':
          '你忘不掉的四秒鐘',
        'A ghost note in {{user}}\'s own locker told him he could put down what he was carrying; on the rooftop he closed the agency\'s case, said he knew who the ghost was and would never tell anyone, told whoever it was that it counted, and stayed past the bell.':
          '{{user}}自己鞋櫃裡的一張幽靈紙條告訴他，可以把身上扛著的東西放下；在屋頂上，他宣布偵探社結案，說他知道幽靈是誰、但永遠不會告訴任何人，對「不知道是誰」說那張紙條很有意義，然後在鐘響後仍留了下來。',
        'Lunch in the classroom. Nanoka is asleep in the sun, and Mitsuki has something to say about her.':
          '午休在教室。菜乃花在陽光下睡著了，而美月有話要說——關於她。',
        'The ghost wrote to you. You closed the case out loud, refused to name the culprit even to her, and told whoever it was that it counted. She said she was very warm. She was. You stayed.':
          '幽靈寫信給你了。你大聲宣布結案，連對她都不肯說出犯人是誰，還告訴「不知道是誰」那很有意義。她說她覺得好熱。她是真的熱。你留了下來。',
        'She knows that you know, and you stayed':
          '她知道你知道，而你留下了',
        'Over Nanoka\'s sleeping head Mitsuki told {{user}} that Nano never asks anyone for anything for herself; he let the silence stand and she was quiet with him for ten minutes, and when Nano woke and asked whether she had told him about herself, she said no.':
          '在睡著的菜乃花頭頂上，美月告訴{{user}}，菜乃從來不會為自己向任何人要求任何東西；他讓那份沉默留著，她便安安靜靜地陪了他十分鐘；菜乃醒來後問她有沒有說她自己的事，她說沒有。',
        'You have something to deliver, the ghost\'s way. The shoe lockers, first thing on a school day.':
          '你有東西要送，用幽靈的方式。上學日一早，鞋櫃。',
        'She described Nano and described herself. You let the quiet stand, and for once she let it. When Nano woke and asked, half asleep, whether she had told you about herself, she said no. She cannot lie.':
          '她說的是菜乃，說的也是她自己。你讓那份安靜留著，而她這一次也讓它留著。菜乃醒來，半睡半醒地問她有沒有跟你說她自己的事，她說沒有。她不會說謊。',
        'Ten quiet minutes, the first ever':
          '第一次的、安靜的十分鐘',
        '{{user}} wrote Mitsuki a note the ghost\'s way, left-handed and unsigned: "You don\'t have to be okay." He put it in her locker while she watched; she saw the ink on his hand, and on the walk to class she chose not to fill the silence.':
          '{{user}}用幽靈的方式寫了一張紙條給美月，用左手寫、不署名：「不好也沒關係。」他當著她的面把紙條放進她的鞋櫃；她看見了他手上的墨漬，走去教室的路上，她選擇不去填滿那份沉默。',
        'Go to her apartment after 19:00. She did not say why, which is new.':
          '19:00以後去她家。她沒說為什麼，這倒是頭一次。',
        '"You don\'t have to be okay." Her paper, her fold, her hour, your left hand. She knows now that you have known since the stakeout. She walked to class beside you and did not say a word, because she did not need to.':
          '「不好也沒關係。」她的紙、她的摺法、她的時間、你的左手。她現在知道了，你從埋伏那天起就知道了。她走在你身旁去教室，一句話也沒說，因為她不需要。',
        'The ghost got a note':
          '幽靈收到了一張紙條',
        'Mitsuki baked cookie nine again with the note she ate on the first day inside; unasked, she told {{user}} her parents were staying abroad another year and that she is not okay, let him see her cry, and signed her first ghost note to him.':
          '美月又烤了一次第九塊餅乾，裡面放著她第一天吃掉的那張紙條；沒有人問，她自己告訴{{user}}父母要在國外再待一年、她並不好，讓他看見她哭，並把幽靈第一張署了名的紙條交給了他。',
        'She answered the question nobody was allowed to ask, and signed her name. (series complete)':
          '她回答了那個誰都不被允許問的問題，還簽上了自己的名字。（系列完結）',
        'Cookie nine, second attempt, and this time you were allowed to open it. Her parents are staying abroad another year. She said she is not okay, and she cannot lie. She let you look, and you stayed.':
          '第九塊餅乾，第二次嘗試，這一次你被允許打開它。她的父母要在國外再待一年。她說她不好，而她不會說謊。她讓你看著，而你留了下來。',
        'A note signed — Mitsuki':
          '一張署名「——美月」的紙條',
        'Leila wore the pink set under her clothes, had {{user}} take her to the school pool after dark so no one would see her, swam in it for an hour, then put his hand on her chest and left for a month.':
          'Leila將粉紅內衣穿在衣服裡，要{{user}}天黑後帶她去學校泳池以免被人看見，穿著它游了一個小時，然後把他的手放到她胸上，再消失一個月。',
        'Goddess of Love & Lust (crossover)': '愛與慾之女神（異界）',
        'Ancient Ruins': '古代遺跡',
        "Leila's crossover shrine — the air turns warm & rose-scented when she manifests":
          'Leila的異界神殿——她現身時空氣會變得溫暖並瀰漫玫瑰香氣。',
        'Yours, Sincerely':
          '誠摯地，屬於你',
        'The coldest girl in your year says one thing and her hands do another. You keep two columns: what she said, and what she did.':
          '你們這屆最冷的女生，嘴上說一套，手上做另一套。你記著兩欄：她說了什麼，她做了什麼。',
        'A girl called Natsuhi Misora had {{user}} return a handkerchief embroidered with his own initials, and said it was her grandmother\'s.':
          '一個叫美空なつひ的女孩讓{{user}}把一條繡著他自己名字縮寫的手帕還給她，還說那是她祖母的。',
        'Natsuhi Misora will find you at lunch in the classroom. She has not said so. She does not need to.':
          '美空なつひ會在午休時到教室找你。她沒有說過。她不需要說。',
        'A white handkerchief on the hallway floor, your initials in red thread, and a girl at the far end who called it her grandmother\'s. You kept it.':
          '走廊地板上的一條白手帕、紅線繡的你的縮寫，還有走廊盡頭一個說那是她祖母的女生。你留下了它。',
        'She knows your name. You did not tell her.':
          '她知道你的名字。你沒有告訴過她。',
        'Natsuhi brought {{user}} a handmade bento with his name on the wrapping cloth and said she had made him lunch \'again\'. It was the first time.':
          'なつひ帶了親手做的便當給{{user}}，包巾上寫著他的名字，還說她「又」幫他做了午餐。那是第一次。',
        'Walk through the park after school. Something has been following you all week.':
          '放學後穿過公園走走。有什麼東西已經跟了你一整個星期。',
        'A bento wrapped in a cloth with your name on it, every favourite you never mentioned — one you only ever ate alone — and the word \'again\' on the first time. You thanked her, and she sharpened.':
          '一個包在寫著你名字的布巾裡的便當、每一樣你從沒提過的最愛——其中一樣你只在一個人的時候吃過——還有第一次就說出口的「又」。你道了謝，而她變得更尖銳。',
        'Every favourite you never told her':
          '每一樣你從沒告訴過她的最愛',
        'A stray cat that had followed {{user}} home for a week turned out to answer to Natsuhi, who had fed it along his route every day so it would; when he changed his route it was on the new one within a day.':
          '跟著{{user}}回家一週的流浪貓，原來聽なつひ的話——她每天沿著他的路線餵牠，就是為了這個；他一換路線，不到一天貓就出現在新路線上。',
        'Be at your desk before 09:00. There is a new seating chart, and nobody remembers a vote.':
          '九點前坐到座位上。黑板上換了一張新的座位表，而沒有人記得投過票。',
        'The cat that followed you all week sat down at her feet. She had named it after you. You changed your route on the fourth day; by the fifth the cat was on the new one.':
          '跟了你一整週的貓，在她腳邊坐下了。她用你的名字叫牠。你在第四天換了路線；到了第五天，貓已經在新路線上了。',
        'A cat that knows the way to your house':
          '一隻認得你家怎麼走的貓',
        'The class seating chart changed overnight; {{user}} now sits by the window with Natsuhi directly behind him, and the girl who used to sit there will not meet his eye.':
          '班上的座位表一夜之間換了；{{user}}現在坐在窗邊，なつひ就在他正後方，原本坐那裡的女生不敢和他對上眼。',
        'Natsuhi is holding a study session in the school library after class. Bring the notebook that never leaves your bag, and check the margin where you wrote the wrong answer on purpose.':
          'なつひ放學後要在學校圖書館開讀書會。帶上那本從不離開你書包的筆記本，看看你故意寫錯答案的那一頁邊欄。',
        'A new seating chart nobody remembers voting on. You by the window, her directly behind you, and a girl two rows over who was \'happy to move\'.':
          '一張沒人記得投過票的新座位表。你在窗邊，她在你正後方，隔兩排的女生「很樂意換位子」。',
        'The seat behind yours, permanently':
          '你後面的那個座位，永久的',
        'Natsuhi ran a study session for {{user}} with flashcards for every subject; the wrong answer he had planted in his own notebook\'s margin, which never left his bag, was corrected in her handwriting and dated.':
          'なつひ為{{user}}開了讀書會，每一科都有單字卡；他故意埋在自己筆記本邊欄裡的錯誤答案——那本筆記本從沒離開過他的書包——被她的字跡改正並標上了日期。',
        'Walk out through the hallway after class. The girls by the lockers will stop talking when she arrives.':
          '放學後走廊那邊走出去。她一走近，置物櫃旁的女生就會閉嘴。',
        'Flashcards for every subject, and the wrong answer you planted corrected in her hand, dated the night you wrote it. The notebook never left your bag. \'You left it on your desk. Once.\'':
          '每一科的單字卡，還有你故意埋下的錯誤答案，被她的字跡改正了，日期就是你寫下它的那一晚。筆記本從沒離開過你的書包。「你放在桌上過。一次。」',
        'A pass mark, and a question you did not ask':
          '一個及格分數，和一個你沒問出口的問題',
        'A classmate tried to warn {{user}} about Natsuhi and went silent when she appeared; only Yuzuki Momose spoke to her as an equal. Natsuhi called walking him home tiresome, he took her at her word and left, and she fell into step and walked him the long way round.':
          '一個同學想提醒{{user}}小心なつひ，她一出現就閉了嘴；只有桃世ゆず姫以平等的口吻和她說話。なつひ說陪他回家很麻煩，他照她的話走了，她卻跟上來，陪他繞了遠路回家。',
        'Coffee at the cafe. Her cousin Mio will join you. Watch how she talks to Mio.':
          '去咖啡廳喝咖啡。她的表妹澪會加入。注意她對澪講話的樣子。',
        'A corridor that goes quiet when she reaches it, a girl who would not finish her sentence, and Yuzuki Momose entirely unafraid. She said walking you home was tiresome; you took her at her word and left, and she fell into step and took the long way.':
          '一條她一走到就安靜下來的走廊、一個沒把話說完的女生，還有完全不怕她的桃世ゆず姫。她說陪你回家很麻煩；你照她的話走了，她卻跟上來，走了遠路。',
        'The long way round, and what it cost her to offer it':
          '那條繞遠的路，以及她開口時付出的代價',
        'At the cafe {{user}} met Mio Kagami and saw Natsuhi with her guard down for the first time — loose, dry, laughing — and the moment Mio left, the cold came straight back.':
          '在咖啡廳，{{user}}見到了加々美澪，第一次看見卸下防備的なつひ——放鬆、乾脆、還會笑——而澪一走，那層冷立刻回來了。',
        'Lunch, the grounds or the rooftop. The girl who was helping with your project has stopped coming.':
          '午休，操場或屋頂。那個幫你做小組報告的女生不再出現了。',
        'With her cousin she laughed. With you the cold came straight back. Now you know it is a position she holds, because you watched her put it down.':
          '面對表妹時她會笑。面對你時那層冷立刻回來。現在你知道那是她刻意撐住的姿態，因為你看過她把它放下。',
        'Proof that the cold is a position, not a person':
          '冷是一種姿態、不是她本人的證據',
        'Dragged onto Mio\'s side of a dodgeball court with the rest of the year, Natsuhi saw that {{user}} was the one person who did not slide; on the rooftop the classmate helping with his project had lost her club place and her group to a committee \'filing error\', Natsuhi told him to go ahead and cry about it, and the whole project was already done in her handwriting in his bag.':
          'なつひ和全年級一起被拖到躲避球場上みお那一邊，看見{{user}}是唯一一個沒有滑過去的人；在屋頂上，幫他做報告的同學因為委員會的「歸檔失誤」失去了社團名額和小組，なつひ叫他去哭啊，而整份報告早已用她的字跡寫完，放在他的書包裡。',
        'Everyone in town is congratulating you. Go to the cafe or the family restaurant and find out what for.':
          '鎮上的人都在恭喜你。去咖啡廳或家庭餐廳，弄清楚是為了什麼。',
        'Dragged across a dodgeball court by her cousin\'s warmth, she saw you were the one person it did not move. Then a misfiled form, a reassigned group, a rumour technically true. \'Go on and cry about it.\' The finished project was already in your bag.':
          '被表姊的溫暖拖過躲避球場，她看見你是唯一一個沒被拉動的人。然後是一張歸錯檔的表格、一次重新分組、一個嚴格說來屬實的傳言。「去哭啊。」做完的報告早就在你的書包裡了。',
        'A finished project she says she did not do for you':
          '一份她說不是為你做的完成品',
        'The cafe owner, the class, and Natsuhi\'s family all congratulated {{user}} on dating her; he had never asked. Her planner dated their first date to the day he kept the handkerchief, not the day she first spoke to him.':
          '咖啡店老闆、全班和なつひ的家人都恭喜{{user}}和她交往；他從來沒有開過口。她的行事曆把第一次約會記在他留下手帕的那天，而不是她第一次跟他說話的那天。',
        'Her apartment, after 19:00. There is one drawer she will let you open.':
          '她的公寓，十九點以後。有一個抽屜她會讓你打開。',
        'Congratulations from everyone, for a relationship you never started. Her planner dates your first date to the day you kept the handkerchief, not the day she spoke to you. She counts your hands too.':
          '所有人都在恭喜你，恭喜一段你從沒開始的關係。她的行事曆把你們的第一次約會記在你留下手帕的那天，而不是她開口跟你說話的那天。她也在數你的手。',
        'A relationship, retroactively':
          '一段追溯生效的關係',
        'In her room Natsuhi let {{user}} open the one drawer: a ledger of every day since the ceremony, the handkerchief\'s twin, a photo from before he knew her. He put his handkerchief in beside its twin, wrote the day\'s line in her ledger himself, and stayed; she did not lock the drawer.':
          '在她的房間裡，なつひ讓{{user}}打開了那個抽屜：一本從開學典禮起每一天的帳本、手帕的另一條、一張他還不認識她時的照片。他把自己的手帕放進去和另一條並排，親手在她的帳本上寫下今天這一行，然後留了下來；她沒有把抽屜鎖上。',
        'You saw the drawer, wrote in it, and stayed. (series complete)':
          '你看了那個抽屜，在裡面寫了字，然後留了下來。（系列完結）',
        'A ledger of every day since the ceremony. The handkerchief\'s twin. A photograph from before you knew she existed. She asked if you were still there. You put your handkerchief in beside its twin, wrote the day\'s line yourself, and she did not lock the drawer.':
          '一本從開學典禮起每一天的帳本。手帕的另一條。一張你還不知道她存在時的照片。她問你是不是還在。你把你的手帕放進去，和另一條並排，自己寫下了今天這一行，而她沒有把抽屜鎖上。',
        'The real her — total, and yours':
          '真正的她——全部的，屬於你的',
        'Nothing Playing':
          '什麼都沒在播',
        'The loudest girl in your year goes quiet for two seconds when she thinks nobody is looking. You have started counting.':
          '你們這屆最吵的女生，在以為沒人看的時候會安靜兩秒。你已經開始數了。',
        'A girl called Airi Kuraha drafted {{user}} into holding a banner for an event that did not exist, then sat alone on the wall with her earphones in and went completely still.':
          '一個叫倉葉アイリ的女生把{{user}}抓去舉一面根本不存在的活動的橫幅，然後一個人坐在矮牆上戴著耳機，整個人靜止不動。',
        'Airi entered you in the three-legged race. She did not ask. Be on the school grounds after class.':
          'アイリ幫你報名了兩人三腳。她沒問過你。放學後到操場去。',
        'A banner for an event that does not exist, a name she got wrong twice, and two seconds on the low wall when she thought nobody was looking. You counted them.':
          '一面為不存在的活動做的橫幅、一個她叫錯兩次的名字，還有她以為沒人在看時、在矮牆上的那兩秒鐘。你數了。',
        'Her name, and two seconds of the real one':
          '她的名字，以及兩秒鐘真正的她',
        'Airi entered {{user}} in the three-legged race without asking, ran him into the ground practising, and got flustered when he said she was actually good.':
          'アイリ沒問過就幫{{user}}報名了兩人三腳，練到把他操翻，而當他說她其實很厲害時她整個慌了。',
        'The Occult Research Club is being audited at the end of the week. Airi needs bodies. Go to the clubroom after class.':
          '靈異研究社這週末要被查帳。アイリ需要真人。放學後去社辦。',
        'Two hours of practice, six bad strategies, and a girl who is genuinely superb at this and cannot be told so.':
          '兩個小時的練習、六個爛戰術，還有一個真的很強、卻不能被這樣說的女生。',
        'Don\'t tell anyone she cared about a stupid race':
          '不准告訴別人她在意一場蠢比賽',
        'Airi\'s Occult Research Club turned out to have eleven invented members and one real one, Urara, for whom she had built the whole club so she would have somewhere to sit.':
          'アイリ的靈異研究社有十四個社員，其中十一個是她編的、兩個是她自己，唯一真實的那個是うらら——整個社團就是為了讓うらら有地方坐才存在的。',
        'Take a wrong turn at lunch. The back stairs behind the building.':
          '午休時走錯一個彎。大樓後面的後樓梯。',
        'Fourteen members, eleven of them invented, two of them her. The real one is Urara, and the club exists so that Urara has somewhere to sit.':
          '十四個社員，十一個是編的，兩個是她本人。真的那個是うらら，而這個社團的存在，就是為了讓うらら有地方坐。',
        'A room she says she only wanted for the free room':
          '一間她說只是為了免費場地才要的社辦',
        '{{user}} found Airi alone and silent on the back stairs with her earphones in; she was on her feet and joking again within a second of noticing him.':
          '{{user}}在後樓梯發現一個人戴著耳機、安靜坐著的アイリ；她注意到他的一秒之內就站起來，又開始耍寶了。',
        'There is a class night out at the family restaurant. She will leave while they are still laughing. Follow her.':
          '班上要在家庭餐廳聚餐。她會在大家還在笑的時候離開。跟上去。',
        'Four seconds this time, and you were counting on purpose. Earphones in, the cable running into a pocket with nothing in it. Then the fastest recovery you have ever seen.':
          '這次是四秒，而你是刻意在數的。耳機戴著，線接進一個空空如也的口袋。然後是你見過最快的恢復。',
        'Four seconds instead of two':
          '從兩秒變成四秒',
        'After a class night out Airi did a bit, left while the room was still laughing, and {{user}} found her on the restaurant\'s back step with her earphones in; Kozuzu came out, the volume came down, and Kozuzu told him Airi will keep going until somebody tells her she can stop.':
          '班上聚餐後，アイリ表演了一段，在全場還在笑的時候就離開了，{{user}}在餐廳後門的台階上找到戴著耳機的她；小鈴出來了，音量降了下來，小鈴告訴他，アイリ會一直撐下去，直到有人告訴她可以停為止。',
        'There is a variety show taping at the shopping mall this weekend. Airi has already entered you both.':
          '這週末購物中心有綜藝節目錄影。アイリ已經幫你們兩個報名了。',
        'She left while they were still laughing. Eleven seconds on the back step before Kozuzu came out and the volume dropped. \'You did the voice twice tonight.\' \'Yeah.\' Nobody has ever told her she can stop.':
          '她在大家還在笑的時候離開了。後門台階上的十一秒，然後小鈴出來，音量降了下來。「你今晚做了兩次那個聲音。」「嗯。」從來沒有人告訴過她，她可以停下來。',
        'A seat near something, not inside it':
          '一個靠近某樣東西的位子，但不在裡面',
        'Airi won an amateur endurance challenge outright at the mall and answered the presenter\'s \'why\' with a joke that went viral instead of the win; asked the same question by {{user}} with no camera on, she gave the same joke word for word.':
          'アイリ在購物中心的業餘耐力挑戰中直接奪冠，主持人問她「為什麼」，她用一個笑話回答，結果爆紅的是笑話而不是勝利；{{user}}在沒有攝影機的時候問了同樣的問題，她給了一字不差的同一個笑話。',
        'She wants you in the gym after class to spot her at something she does not need spotting at.':
          '她要你放學後到體育館，幫她「保護」一件她根本不需要人保護的事。',
        'She beat every adult in the bracket, and six hundred thousand people have seen the punchline. You asked her why with no camera on. Same joke, word for word.':
          '她打敗了對戰表上的每一個大人，六十萬人看過那個笑點。你在沒有攝影機的時候問了她為什麼。同一個笑話，一字不差。',
        'A viral clip of the joke, not the win':
          '一段紅了笑點、沒紅勝利的影片',
        '{{user}} laughed for real at something Airi said that was not a joke, and she did not know what to do with it.':
          '{{user}}因為アイリ說的一句根本不是笑話的話真心大笑，而她完全不知道該拿那個笑聲怎麼辦。',
        'Lunch in the classroom. Somebody had bad news this morning, and Airi does not know yet.':
          '午休在教室。今天早上有人收到壞消息，而アイリ還不知道。',
        'A laugh she did not construct, could not repeat, and had no idea what to do with. \'…That one wasn\'t even a joke.\'':
          '一個她沒有設計、複製不出來、也不知道該怎麼辦的笑聲。「……那句根本不是笑話啊。」',
        'Something of hers you liked that was not the act':
          '她身上某個你喜歡、卻不是那套表演的東西',
        'Airi ran a bit into a room that had just had bad news, made it worse trying to fix it, left, and told {{user}} on the stairs that being funny is what she is for.':
          'アイリ在一個剛收到壞消息的教室裡演了一段，想補救卻越弄越糟，最後離開了，並在樓梯上告訴{{user}}：搞笑就是她的用途。',
        'Back to the stairs after class. This time do not announce yourself, and do not leave.':
          '放學後再回樓梯那裡。這次不要出聲，也不要離開。',
        'A bit into a cold room, two more to fix it, and the first room she has ever walked out of. On the stairs she fished for a laugh with the safety off, and you did not give it. \'It\'s fine, it\'s what I\'m for.\'':
          '對著冷掉的房間演了一段，又用兩段去補救，然後是她這輩子第一次走出一個房間。在樓梯間，她卸下保險釣一個笑聲，而你沒有給。「沒事，我就是幹這個的。」',
        'The safety off':
          '自嘲時保險栓被拔掉了',
        '{{user}} asked for Airi\'s other earbud and found nothing playing — the earphones are how the loudest girl in the year gets left alone — and told her she can stop when it is him; she put the earbud back in, switched nothing on, and stayed.':
          '{{user}}要了アイリ的另一邊耳機，發現什麼都沒在播——耳機是這屆最吵的女生讓別人放過她的方法——他告訴她，在他面前可以停下來；她把耳機塞回去，什麼也沒打開，留了下來。',
        'Her room, after 19:00. She invited you, and there was no bit attached to the invitation.':
          '她的房間，十九點以後。是她邀你的，而且這次沒有附帶任何段子。',
        'You asked for the other earbud. There was no music. There has never been any music. It is the only way anyone leaves her alone. You told her she can stop. Nobody ever had.':
          '你要了另一邊耳機。沒有音樂。從來就沒有音樂。那是唯一能讓別人放過她的方法。你告訴她，她可以停下來。從來沒有人說過。',
        'Nothing playing, and the reason why':
          '什麼都沒在播，以及原因',
        'Airi asked {{user}} to let her stop being funny for an hour, shared the earbud with nothing playing as a joke between them, then turned the act back on at full volume for him alone and left the earphones on the desk.':
          'アイリ請{{user}}讓她停止搞笑一個小時，把什麼都沒在播的耳機分給他當作兩人之間的笑話，然後只為他一個人全音量地重新開演，耳機留在了桌上。',
        'She asked for an hour off, took it, and came back on at full volume. (series complete)':
          '她要了一個小時的休息，拿到了，然後全音量地回來了。（系列完結）',
        '\'Is it okay if I don\'t do the funny thing. For like an hour.\' One earbud each, nothing playing, an hour of quiet — and then the act back on, her best, for an audience of one. She did not say don\'t tell anyone. The earphones stayed on the desk.':
          '「可以……不做那個搞笑的事嗎。大概一個小時就好。」一人一邊耳機，什麼都沒在播，一小時的安靜——然後表演重新開場，她最好的一段，觀眾只有一個人。她沒有說「別告訴任何人」。耳機留在了桌上。',
        'An hour off, and the show back on for you':
          '一小時的休息，然後為你重新開演',
        'Plain Yuzuki':
          '平凡的ゆず姫',
        'The Momose heiress corrects everything in reach and signs it with her family name. She is never wrong. You have started checking her work.':
          '桃世家的千金把眼前的一切都訂正一遍，再用家族的姓署名。她從不出錯。你開始檢查她的訂正了。',
        'Yuzuki Momose corrected four things in {{user}}\'s homework unasked, signed the corrections with her family name, said \'it was wrong, and now it is not\', and left without waiting to be thanked.':
          '桃世ゆず姫沒人拜託就訂正了{{user}}作業裡的四個地方，用家族的姓為訂正署名，說了「剛才是錯的，現在不是了」，然後沒等人道謝就離開了。',
        'Yuzuki Momose\'s stockings fail weekly. Be in the classroom after the last bell when the next one does, and look at the homework she corrected when it comes back marked.':
          '桃世ゆず姫的絲襪每週都會壞一次。下一次壞的時候，放學鐘響後留在教室，並在她訂正過的作業批改發回時看一看。',
        'Four corrections in order of severity, signed \'Momose\' like a document, a crest she touched as she disowned it. \'It was wrong, and now it is not. You\'re welcome.\' She did not wait to be thanked.':
          '四處依嚴重程度排列的訂正，像公文一樣署名「桃世」，一枚她一邊否認一邊觸碰的家徽。「剛才是錯的，現在不是了。不客氣。」她沒有等人道謝。',
        'Four corrections, signed with her family name':
          '四處訂正，署著她的姓',
        'Yuzuki\'s stocking gave way at the thigh, she told the whole class the exact circumference responsible, commandeered {{user}} to the hosiery counter, proved the reinforced pair correct and bought the sheer anyway, and bought him socks because his were a disgrace; the marked homework showed that one of her four corrections had not been an error.':
          'ゆず姫的絲襪在大腿處裂開，她向全班宣布了該負責的確切圍度，把{{user}}徵用到絲襪專櫃，證明了加強款才是正確的卻照樣買了薄款，還因為他的襪子丟人而幫他買了襪子；批改發回的作業顯示，她那四處訂正裡有一處本來就不是錯誤。',
        'She has produced a curriculum. The library after class, and bring the page she signed.':
          '她做了一份課程表。放學後去圖書館，帶著她署過名的那一頁。',
        'Three of her four corrections were real. The fourth was only her taste. Then a stocking that failed at the thigh, a circumference announced to the number, a proof that the reinforced pair was correct, and four pairs of the sheer. Your socks were fine.':
          '她的四處訂正有三處是真的。第四處只是她的喜好。然後是一隻在大腿處報廢的絲襪、一個精確到數字的圍度、一份證明加強款才正確的論證，以及四雙薄款。你的襪子其實沒有問題。',
        'Socks, because yours were a disgrace':
          '襪子，因為你的太丟人了',
        'Yuzuki announced she would tutor {{user}} and produced a bound curriculum far larger than his four errors called for; her family replaced the socks she had bought him with twelve monogrammed pairs, and he wrote down a guess — she is not correcting him, she wants something and has no other way to say it.':
          'ゆず姫宣布要為{{user}}補習，拿出一本裝訂成冊的課程手冊，分量遠遠超過他那四個錯誤所需要的；她家把她買給他的襪子換成了十二雙繡著姓名縮寫的，而他寫下了一個猜測——她不是在訂正他，她是想要什麼，卻沒有別的說法。',
        'Go to the arcade on a free day. Ask her what SHE wants to play, not what a Momose should.':
          '放假日去遊樂場。問她「妳」想玩什麼，而不是桃世家的人該玩什麼。',
        'A bound, indexed curriculum for four errors, breaks scheduled to your measured attention span, and one sentence of frost for Suzu. Her family replaced the socks she bought you with twelve monogrammed pairs. You wrote one line on the back of her signed page.':
          '為了四個錯誤而編的一本裝訂、附索引的課程手冊，按你實測的專注時間排好的休息，還有給鈴的一句冰霜。她家把她買給你的襪子換成了十二雙繡著姓名縮寫的。你在她署名的那一頁背面寫了一行字。',
        'A term of tutoring, for four errors':
          '為了四個錯誤，補習一整個學期',
        '{{user}} asked Yuzuki what SHE wanted to play, a question with no correct answer; she said nobody had asked her that since she was small, chose the crane, computed it out loud and won eight times until staff stepped in.':
          '{{user}}問ゆず姫「妳」想玩什麼——一個沒有正確答案的問題；她說從她還小的時候起就沒有人這樣問過她了，選了夾娃娃機，把物理算出聲來，連贏八次直到店員出面。',
        'The library after the last bell, the long table. Bring a page with nothing wrong in it.':
          '放學鐘響後去圖書館，那張長桌。帶一頁挑不出任何錯的作業。',
        '\'Do you know how long it has been since anyone asked ME?\' Then the claw\'s grip strength out loud, eight wins, a racing seat declared defective, and an armful of plush handed over like an invoice.':
          '「你知道多久沒有人問過『我』了嗎？」然後是把爪子握力算出聲、八次全勝、一張被判定為設計瑕疵的賽車座椅，還有像結清帳單一樣交給你的一整抱娃娃。',
        'Eight plush toys, settled like an invoice':
          '八隻娃娃，像結清帳單一樣',
        '{{user}} brought Yuzuki a page with no error in it and she had nothing to say to him for the whole study session; she aimed one sharpened sentence at Suzu, who answered its literal content and missed the edge, and Yuzuki left early saying \'then what is the point of her\'.':
          '{{user}}帶給ゆず姫一頁沒有任何錯誤的作業，整場自習她對他一句話也說不出來；她把一句磨利的話對準了鈴，鈴只回答了字面的內容而完全沒聽出鋒芒，ゆず姫提早離開，說了一句「那她還有什麼意義」。',
        'The hallway by the lockers after class. A corridor is about to go quiet, and she will walk through it without noticing.':
          '放學後，置物櫃旁的走廊。一條走廊即將安靜下來，而她會毫無察覺地走過去。',
        'A page with nothing wrong in it, and for ninety minutes she had not one word for you. She sharpened a sentence at Suzu instead, and Suzu answered its content and missed the edge. \'Then what is the point of her.\'':
          '一頁挑不出任何錯的作業，而整整九十分鐘她對你一個字也沒有。她轉而對鈴磨利了一句話，鈴回答了內容，卻沒聽出鋒芒。「那她還有什麼意義。」',
        'Ninety minutes with nothing to correct':
          '九十分鐘，沒有東西可以訂正',
        'Yuzuki walked through a corridor that had gone silent for Natsuhi without noticing why and traded three sentences with her as an equal; she could find no error in the last one — \'at least I know what I\'m doing it for\' — told {{user}} that Natsuhi has never once lied about what she wants, and got into the family car as she does every day.':
          'ゆず姫走過一條因なつひ而安靜下來的走廊，卻沒察覺是為什麼，並以對等的口吻和她交換了三句話；最後一句她找不出任何錯誤——「至少我知道自己是為了什麼」——她告訴{{user}}，なつひ從來沒有對自己想要的東西說過謊，然後像每天一樣坐進了家裡的車。',
        'The station after class. She has ruled your route home inefficient, and she intends to prove it at the wall map.':
          '放學後去車站。她裁定你回家的路線沒有效率，並打算在牆上的路線圖前證明這一點。',
        'She walked through a corridor that had gone silent for Natsuhi and retied a frightened girl\'s ribbon on the way. Natsuhi\'s third sentence: \'At least I know what I\'m doing it for.\' She opened her mouth to correct it and found no error. Then the car, as always.':
          '她走過一條因なつひ而鴉雀無聲的走廊，途中還替一個嚇壞的女生重新繫好了緞帶。なつひ的第三句話：「至少我知道自己是為了什麼。」她張口要訂正，卻找不到錯。然後是那輛車，一如往常。',
        'A sentence she could not correct':
          '一句她無法訂正的話',
        'At the station map Yuzuki tried to prove {{user}}\'s route home inefficient and every alternative was longer; she worked out for herself, item by item, that she had never been correcting him, then played a plain tune on the station piano, left a wrong bar wrong, and told him it was for him — she had only ever played for evaluators.':
          '在車站的路線圖前，ゆず姫想證明{{user}}回家的路線沒有效率，結果每一條替代路線都更遠；她自己一條一條推導出來：她從來不是在訂正他。然後她在車站的鋼琴上彈了一首平凡的曲子，彈錯的一小節就讓它錯著，並告訴他那是為他彈的——她以前只為評審彈過。',
        'The rooftop after class. She has something to raise, and she has checked that it is not a correction.':
          '放學後去屋頂。她有一件事要提出，而且她確認過了，那不是訂正。',
        'Every other route was longer. \'It was wrong, and now it is\' would not finish. Item by item, and then: \'Therefore I was not correcting you.\' A plain tune on the station piano, one bar left wrong. \'That was for you.\'':
          '其他每一條路線都更遠。「剛才是錯的，現在——」這句話說不完。一條一條數過之後：「因此，我並不是在訂正你。」車站鋼琴上一首平凡的曲子，有一小節就讓它錯著。「那是為你彈的。」',
        'A tune played for a person, not an evaluator':
          '一首為人而彈、不為評審的曲子',
        'On the rooftop Yuzuki counted the times {{user}} had called her by her given name and made the first request of her life, that he keep using it; then she told him his tie was crooked, stopped, said it was not crooked and that she wished to, and straightened it anyway.':
          '在屋頂上，ゆず姫數了{{user}}叫過她名字的次數，並提出了她人生的第一個請求：請他繼續這樣叫她；接著她說他的領帶歪了，停住，說領帶並沒有歪、是她想這麼做，然後還是替他整了整。',
        'The school gate after the last bell. The car will be waiting for her, as it is every day.':
          '放學鐘響後去校門。那輛車會像每天一樣等著她。',
        'The number of times you have used her given name, and the date of the first. The first request she has ever made: keep using it. \'Your tie is crooked.\' She stopped. \'It is not crooked. I wished to.\'':
          '你叫過她名字的次數，以及第一次的日期。她這輩子第一個請求：繼續這樣叫她。「你的領帶歪了。」她停住了。「並沒有歪。是我想這麼做。」',
        'A request, which she did not know how to phrase':
          '一個她不知道該怎麼措辭的請求',
        'At the school gate Yuzuki declined the family car for the first time in her life — \'I am with a person\' — and walked home with {{user}}, choosing every turning because she preferred it, her hands shaking, while the car followed at walking pace.':
          '在校門口，ゆず姫人生第一次拒絕了家裡的車——「我和一個人在一起」——和{{user}}一起走路回家，每一個轉角都因為自己喜歡而選，雙手發著抖，而那輛車以步行的速度跟在後面。',
        'The Momose estate, after 19:00. She will show you her room. Nothing in it is hers.':
          '桃世家的宅邸，十九點以後。她會帶你看她的房間。裡面沒有一樣東西是她的。',
        'A black car, an attendant who has known her since she was three, four points delivered without raising her voice, and the fourth: \'I am with a person.\' Her hands shook. She chose every turning because she preferred it, and the car followed at walking pace.':
          '一輛黑色的車、一個從她三歲就認識她的隨從、四點沒有提高音量的陳述，而第四點是：「我和一個人在一起。」她的手抖了。每一個轉角她都因為喜歡而選，那輛車以步行的速度跟在後面。',
        'The first car she ever sent away':
          '她第一次遣走的車',
        'In a room where nothing was hers, Yuzuki struck the one false correction from {{user}}\'s homework page and signed the strike with her given name, took off the Momose crest hairpin she had worn since she was four and asked him to see just Yuzuki; then she pinned it back on the wrong side on purpose and told him he would accompany her.':
          '在一個沒有一樣東西屬於她的房間裡，ゆず姫劃掉了{{user}}那頁作業上唯一不成立的訂正，並用自己的名字為這一劃署名，取下了從四歲起就戴著的桃世家徽髮飾，請他只看見ゆず姫；然後她故意把髮飾別回了另一邊，並告訴他，他要陪她走一趟。',
        'She signed her own name, asked to be seen without the crest, and pinned it back on the wrong side. (series complete)':
          '她簽下了自己的名字，請你看見沒有家徽的她，然後把家徽別回了另一邊。（系列完結）',
        'A room she walked you round like a curator, and nothing in it chosen by her. She struck the fourth correction and signed the strike \'Yuzuki\'. The hairpin came off. \'Just Yuzuki.\' Then she pinned the crest back on the wrong side, on purpose.':
          '她像策展人一樣帶你走過房間，裡面沒有一樣是她選的。她劃掉了第四處訂正，並在那一劃旁署名「ゆず姫」。髮飾取了下來。「只是ゆず姫。」然後她故意把家徽別回了另一邊。',
        'Just Yuzuki, and the crest on the wrong side':
          '只是ゆず姫，家徽別在另一邊',
        'Somehow':
          '總會有辦法的',
        'The mellow girl of the year fell asleep in the one patch of sun, handed you her plant, and told you it would sort itself out. It has not. You are on plant duty.':
          '全年級最悠哉的女孩在唯一一塊有陽光的地方睡著了，把她的植物交給你，說總會有辦法的。並沒有。你現在負責澆水了。',
        'Nanoka Ousaka was asleep in the one patch of sun after class, gave {{user}} half of it, and then handed him her plant because he was going that way; he was not.':
          '逢坂菜乃花放學後在唯一一塊陽光下睡著了，分了{{user}}半塊陽光，然後因為他「順路」而把她的植物交給了他；他並不順路。',
        'Nanoka has left you holding her plant. Be in the classroom first thing in the morning; by the time you get there it will have sorted itself out.':
          '菜乃花把她的植物留在你手上了。一早就到教室去；等你到的時候，有些事已經自己解決掉了。',
        'A girl asleep in the last of the sun, one eye open, \'you\'re standing in my sun\', half a sunbeam offered, and a pot pressed into your hands with directions to the left windowsill, or the right.':
          '一個在最後一點陽光裡睡著的女孩、睜開的一隻眼、「你擋到我的太陽了」、分出來的半塊陽光，還有一盆塞進你手裡的植物，附帶「左邊的窗台，或者右邊」的指示。',
        'A plant you did not ask for, and her name':
          '一盆你沒開口要的植物，以及她的名字',
        'Nanoka did {{user}}\'s watering for one night because he looked tired, took three hours over it and slept on the classroom floor when the gates locked, and by morning the plant had climbed three storeys of the school; he cut it down while she held the ladder and then slept beside it, and she gave him her own cushion.':
          '菜乃花因為{{user}}看起來很累，替他澆了一晚的水，花了三個小時，校門上鎖後就睡在教室地板上，到了早上那盆植物已經爬上三層樓的校舍；他把它剪下來，她扶著梯子，然後在梯子旁睡著，還把自己的坐墊送給了他。',
        'She will not let you do her homework. Sit with her in the library after class and learn what that costs.':
          '她不會讓你替她寫作業。放學後在圖書館陪她坐著，看看那要花你多少。',
        'Found at first bell asleep under the windowsill beside a thermos, having spent three hours on your watering; by morning the plant had climbed three storeys. \'It wanted to see the roof.\' Eleven minutes of ladder-holding, one cutting across her lap, and her own cushion, for you.':
          '第一堂鐘響時，她被發現睡在窗台下，旁邊一個保溫瓶，花了三個小時替你澆水；到了早上，那盆植物已經爬上了三層樓。「它想看看屋頂。」扶了十一分鐘的梯子，腿上放著一段扦插枝，還有她自己的坐墊，給你。',
        'A cushion for the sun, from the girl who slept on the floor':
          '一個曬太陽用的坐墊，來自睡在地板上的女孩',
        '{{user}} offered to do Nanoka\'s homework and she was shocked — the plant does not mind who waters it, but the homework would know — so she did it herself over three hours, fell asleep on the last question, and thanked him for not writing it.':
          '{{user}}提議替菜乃花寫作業，她嚇了一跳——植物不介意誰澆水，但作業會知道——於是她花了三個小時自己寫，在最後一題睡著，並謝謝他沒有替她寫。',
        'The quiet circle takes its tea outside at lunch. The low wall in the courtyard. Count the cats.':
          '安靜小圈子午休時會到外面喝茶。中庭那道矮牆。數數有幾隻貓。',
        '\'That\'s cheating~\' — the most awake anyone has seen her. Three hours, a drift at every pleasant thing, \'mmh, where was I\', and a last question she slept on that you did not write. \'You didn\'t do it for me. Thank you.\'':
          '「那是作弊喔~」——沒有人見過她這麼清醒。三個小時，每遇到一件愉快的事就出神，「嗯，我寫到哪了~」，還有一道她睡著在上面、而你沒有替她寫的最後一題。「你沒有替我寫。……謝謝你。」',
        'Homework she would not let you do':
          '一份她不讓你替她寫的作業',
        'Eleven strays chose Nene at the courtyard wall and Nanoka lay down beside her wanting one; none came, a cat slept a hand\'s width from her fingers all through the missed period and she never reached for it, and when they left she said it had sorted itself out — Nene got them all.':
          '十一隻流浪貓在中庭的矮牆邊選了ねね，菜乃花躺在她旁邊，想要一隻；一隻也沒有來，一隻貓在離她指尖一掌寬的地方睡了整整一堂翹掉的課，她始終沒有伸手，貓走了以後她說事情自己解決了——貓都給ねね了。',
        'A free afternoon, a park bench in the sun, and a cat who got there first.':
          '放假的下午，公園裡一張曬得到太陽的長椅，還有一隻先到的貓。',
        'Eleven cats on Nene, a few on you, none on the one girl who wanted one. A cat slept a hand\'s width from her fingers all through the missed period and she never reached. \'No,\' to Nene, flat and instant. \'It sorted itself out. Nene got them all.\'':
          '十一隻貓在ねね身上，幾隻在你身上，唯一想要貓的那個女孩身上一隻也沒有。一隻貓在離她指尖一掌寬的地方睡了整整一堂翹掉的課，她始終沒有伸手。對ねね說的那句「不要」，平淡而且立刻。「自己解決了喔。貓都給ねね了。」',
        'A guess, written on the back of a plant rota':
          '一個猜測，寫在植物值日表的背面',
        'A cat had Nanoka\'s sunny bench and she took the shade; asked to get {{user}} the sun she talked the cat over in eleven minutes and gave him the place, then sat in the shade and never asked him to make room, and when the sun had gone she said it had sorted itself out — \'nobody needs it now.\'':
          '一隻貓佔了菜乃花曬太陽的長椅，她坐到了陰影裡；{{user}}請她幫忙要個曬太陽的位置，她花十一分鐘說服了那隻貓，把位置讓給他，然後坐回陰影裡，始終沒有開口請他挪一挪，等太陽走了，她說事情自己解決了——「現在誰也不需要它了。」',
        'Lunch in the classroom. Somebody is about to be unkind to Nene, and the slowest girl in the school is about to move.':
          '午休在教室。有人即將對ねね不客氣，而全校最慢的女孩即將動起來。',
        'For you she talked a cat off its bench in eleven minutes. For herself she would not ask for a hand\'s width of it. When the sun had gone: \'See~? It sorted itself out.\' \'What did?\' \'The bench. Nobody needs it now.\' Both lines were on the rota sheet before you left.':
          '為了你，她花十一分鐘把一隻貓從長椅上勸開。為了她自己，她連一掌寬的位置都不肯開口要。太陽走了以後：「你看~？自己解決了。」「什麼解決了？」「長椅呀。現在誰也不需要它了。」這兩句話，在你們出門前就已經寫在值日表上了。',
        'A prediction that came back as written':
          '一個如實應驗的預測',
        'Four girls from another class came to look at Nene after the photograph, and Nanoka stood up unasked for the first time since the entrance ceremony and stood in front of Nene\'s desk until Urara and Suzu sent them away; asked afterwards when she had last got up like that for something of her own, she thought for a long time and said there had never been anything.':
          '另一個班的四個女生在那張照片之後跑來看ねね，菜乃花在沒有人拜託的情況下站了起來，這是入學典禮以來的第一次，她站在ねね的桌前，直到うらら和鈴把她們趕走；事後被問到上一次為了自己的事這樣站起來是什麼時候，她想了很久，說從來沒有過。',
        'The Japanese-style room after class. You asked what a proper temae looks like, and she said yes.':
          '放學後的和室。你問過正式的點前是什麼樣子，而她說了好。',
        'She stood up, unasked, for the first time since the entrance ceremony, and stood there being awake until they left. Then your one question, and her answer after a long, honest look: \'I don\'t think there\'s been anything. Things of mine sort themselves out~.\'':
          '她站了起來，沒有人拜託她，這是入學典禮以來的第一次，然後清醒地站在那裡，直到她們離開。接著是你那一個問題，以及她認真想了很久之後的回答：「我想沒有過耶。我的事情都會自己解決~。」',
        'The answer you wrote down before you asked':
          '你在開口之前就寫下的答案',
        'Nanoka performed a perfect temae for {{user}}, and when he gave the guest\'s line and invited her to make a bowl for herself her hands lost the tempo; she saw the difference, counted for herself the things she had let go — \'they didn\'t sort themselves out, they just went\' — then made the bowl again, exactly, and drank the first proper tea she had ever made for herself.':
          '菜乃花為{{user}}完成了一次完美的點前，而當他說出客人的那句話、請她也為自己泡一碗時，她的手失去了節奏；她看出了差別，自己數出了那些被她放掉的東西——「它們並沒有自己解決，它們只是走了」——然後分毫不差地重新泡了一碗，喝下了她這輩子第一碗認真為自己泡的茶。',
        'Lunch in the classroom. Mitsuki wants a word about her oldest friend.':
          '午休在教室。美月想跟你談談她最老的朋友。',
        'A perfect bowl for you; then, at one line from the form, a bowl for herself that would not hold its tempo. \'My hands know how to do it for you.\' The sun, the cushion, the cat, the bench: \'They didn\'t sort themselves out, did they~. They just went.\' Then she made it again, exactly, and drank it. \'I make good tea.\'':
          '一碗給你的、完美的茶；然後，憑著禮法裡的一句話，一碗給她自己的、怎麼也守不住節奏的茶。「我的手知道怎麼為你泡。」陽光、坐墊、貓、長椅：「它們並沒有自己解決，對吧~。它們只是走了。」然後她重新泡了一次，分毫不差，喝了下去。「我泡的茶很好喝。」',
        'The first proper bowl she ever made for herself':
          '她第一碗認真為自己泡的茶',
        'Over Nanoka\'s head Mitsuki told {{user}} that Nano has never asked anyone for anything for herself and that he would know if she ever did; Nanoka had heard all of it, and when the sun moved onto his desk she asked him to swap seats, for her — \'that one wasn\'t weather\' — the first thing she has ever asked for.':
          '在菜乃花的頭頂上，美月告訴{{user}}，菜乃從來沒有為自己向任何人要求過任何東西，而如果她有一天開口，他會知道的；菜乃花全都聽見了，當陽光移到他的桌上時，她請他跟她換位子，為了她自己——「這次不是天氣」——這是她這輩子第一次開口要東西。',
        'Someone is watering the plant every day, on time, and it is not you. She thinks it is. Go to the school after 19:00 and find out.':
          '有人每天準時替那盆植物澆水，而那不是你。她以為是你。十九點以後去學校，弄清楚是誰。',
        'Mitsuki\'s warning, given over a girl who was not asleep. Then the sun moved onto your desk, and where she would have let it go she asked: \'Swap with me. For me. That one wasn\'t weather.\' The first thing she ever asked for was a chair.':
          '美月的警告，在一個並沒有睡著的女孩頭頂上說出口。然後陽光移到了你的桌上，在她本來會放手的地方，她開口了：「跟我換位子。為了我。這次不是天氣。」她這輩子第一次開口要的東西，是一張椅子。',
        'The first thing she ever asked for: your seat':
          '她第一次開口要的東西：你的座位',
        'The plant was being watered daily, on time, by neither of them; Nanoka said she wanted to know and proposed breaking into the school at night, they found a tree spirit doing it because she thanks the plants every afternoon, and when she had finished laughing she worked out that nothing had ever sorted itself out — she had asked, and somebody always heard.':
          '那盆植物每天準時被澆水，卻不是他們兩個之中的任何一個；菜乃花說她想知道，提議晚上潛入學校，他們發現一個樹靈在澆水，因為她每天下午都向植物道謝，而她笑完之後自己想通了：從來沒有什麼事是自己解決的——是她開口了，而總有誰聽見了。',
        'Her room, after 19:00. There is a chart on the wall she has never shown anyone.':
          '她的房間，十九點以後。牆上有一張她從未給任何人看過的圖。',
        '\'Isn\'t it you~?\' \'I want to know. Let\'s go and look.\' Over the wall, asking for every handhold, and at the sill a small green tree spirit with a watering can far too big for it, bowing to her. She laughed until she lay down. Then: \'Nothing ever sorted itself out. I asked, and somebody always heard.\'':
          '「不是你嗎~？」「我想知道。我們去看看。」翻過圍牆，每一個落腳處都開口請你幫忙，而窗台邊是一個小小的、綠色的樹靈，拿著一個對它來說太大的澆水壺，向她鞠躬。她笑到躺了下來。然後：「從來沒有什麼事是自己解決的。是我開口了，而總有誰聽見了。」',
        'A tree spirit on plant duty, and a laugh that used everything':
          '一個負責澆水的樹靈，和一場用盡一切的大笑',
        'In a room mapped for sun hour by hour, with {{user}}\'s own hours pencilled in, Nanoka showed him the cutting that had grown toward his cushion and stopped a hand\'s width short, and asked for the first big thing of her life: \'It won\'t sort itself out, and I can\'t chase you. So stay. That\'s the help I need.\'':
          '在一個把陽光逐小時畫成地圖、還用鉛筆添上了{{user}}的時刻的房間裡，菜乃花讓他看那段朝他的坐墊生長、卻在一掌寬之外停下的扦插枝，然後提出了她人生中第一個重大的請求：「這件事不會自己解決，而我沒辦法追你。所以留下來。那就是我需要的幫忙。」',
        'You stayed. That was the help. (series complete)':
          '你留下來了。那就是幫忙。（系列完結）',
        'Cushions, plants, the cutting flowering at night, and the sun map with your hours pencilled in. A tendril that grew toward your cushion and stopped a hand\'s width short. \'It won\'t sort itself out. I can\'t chase you~. So stay.\' A hand patting the cushion beside her, once.':
          '一堆堆的坐墊、植物、在夜裡開花的扦插枝，還有那張用鉛筆添上了你的時刻的陽光地圖。一條朝你的坐墊生長、卻在一掌寬之外停下的藤蔓。「這件事不會自己解決。我沒辦法追你~。所以留下來。」一隻手拍了拍她身旁的坐墊，一下。',
        'Stay. That was the help.':
          '留下來。那就是幫忙。',
        'Onee-chan\'s Line':
          '姐姐的台詞',
        'The big sister of the year fixed your broken thing in forty seconds, read your whole week off your face while she did it, and made you keep her multi-tool because Onee-chan has three.':
          '全年級的大姐頭四十秒就修好了你壞掉的東西，一邊修一邊把你這一週全看穿了，還硬把她的多功能工具塞給你，因為姐姐有三把。',
        'Nemu Enomoto fixed {{user}}\'s broken thing in forty seconds, read his week off his face while she did it, and made him keep her multi-tool because Onee-chan has three.':
          '榎本ねむ四十秒就修好了{{user}}壞掉的東西，一邊修一邊從他臉上讀出了他這一週，還讓他留著她的多功能工具，因為姐姐有三把。',
        'Lunch in the classroom. Something will go missing and the room will lose its mind. Watch what Onee-chan does instead.':
          '午休在教室。會有東西不見，全班會炸鍋。看姐姐怎麼做。',
        'Forty seconds with a multi-tool, a read that got every part of his week right, one forehead poke, and a tool pressed into his hand on top of the thing she had just mended.':
          '四十秒和一把多功能工具、一段把他這週每件事都說中的觀察、一記彈額頭，還有一把連同剛修好的東西一起塞進他手裡的工具。',
        'Her multi-tool, because Onee-chan has three':
          '她的多功能工具，因為姐姐有三把',
        'Something was stolen at lunch and Nemu solved it from her seat in three sentences, then took the girl into the corridor and fixed the reason instead of reporting the theft.':
          '午休時有東西被偷了，ねむ坐在位子上用三句話破了案，然後把那女孩帶到走廊，修好的是原因而不是舉報竊案。',
        'Umi and Iori are planning something at the arcade after class. Go, and let them think it is working.':
          '羽見和いおり放學後在遊樂場有計畫。去，並且讓她們以為得逞了。',
        'Three sentences from a seat she never left: who moved desks, whose bag was zipped for the first time all term, and the fact that the thief was the only person not searching. Then a corridor, and no name ever said out loud.':
          '坐著沒動就說出的三句話：誰換了座位、誰的書包整學期第一次拉上，還有小偷是全場唯一沒在找東西的人。然後是一條走廊，和一個始終沒被說出口的名字。',
        'A theft solved by watching the room instead of searching it':
          '一樁靠觀察而非搜查破掉的竊案',
        'Umi and Iori rigged a haunted walkthrough to make Onee-chan scream for the souvenir photo; Nemu read the setup in ten steps, turned them to face her, and the photo came out with both of them screaming and her grinning at the camera.':
          '羽見和いおり設局要讓姐姐在鬼屋裡尖叫好拍進紀念照；ねむ走十步就看穿了，把她們轉成背對機關，照片拍出來是兩個女孩尖叫、她對著鏡頭笑。',
        'A free day at the ruins. The class is holding a test of courage, and the thing waiting there is not a sheet.':
          '放假日去遺跡。班上在辦試膽大會，而那裡等著的不是一塊白布。',
        'A glance at a curtain too early, a friend watching her face instead of the corridor, and a floor mat they both stepped around. Then two volunteers holding her hands with their backs to it, one \'WOW!\', and a souvenir photo of two girls screaming beside one grinning big sister.':
          '提早一步瞥了一眼的布簾、盯著她的臉而不是走廊的朋友，還有兩人都繞開的那塊地墊。然後是兩位背對機關、牽著她手的志願者、一聲「哇！」，和一張兩個女孩尖叫、一個大姐頭咧嘴笑的紀念照。',
        'A souvenir photo, and snacks bought by the losers':
          '一張紀念照，和輸家買的零食',
        'The test of courage at the ruins turned up a real ghost; the class fled and Nemu read it instead — not haunting, interrupted — found the lantern it never lit, and lit it with {{user}}.':
          '遺跡的試膽大會招來了真的幽靈；全班逃光，ねむ卻讀了它——不是作祟，是被打斷了——找出它從沒點上的那盞燈，和{{user}}一起點亮。',
        'Lunch at the cafeteria. Mio Kagami wants a word, and she will wait until Nemu is called away to have it.':
          '午休去食堂。鏡美緒有話要說，而她會等到ねむ被叫走才說。',
        'Standing to one side of the door, hands busy doing nothing, eyes going back to the same corner. \'That is not a haunting. That is someone who got interrupted.\' Then a wick, a flint, and a bow from something that was no longer there.':
          '站在門的一側而不是門口、手忙著卻什麼也沒做、視線一再回到同一個角落。「那不是作祟。那是被打斷的人。」然後是燈芯、火石，和一個已經不在那裡的東西的鞠躬。',
        'A lantern lit about forty years late':
          '一盞遲了約四十年才點上的燈',
        'Mio got a second lunch into Nemu by making it Nemu\'s rescue, and told {{user}} afterwards that it only ever works that way — Nemu has never taken a thing that was simply for her — and that Mio is too obvious to try anything else.':
          '美緒把第二個便當變成ねむ的「救援」，讓她吃了下去，事後告訴{{user}}，這招從來只有這樣才行得通——ねむ從沒收下過任何單純是給她的東西——而美緒太明顯了，試不了別的辦法。',
        'She rides in every morning. Be on the road early enough to be there when something goes wrong.':
          '她每天早上騎車上學。早一點到路上，好在出事的時候在場。',
        '\'Stop being Onee-chan,\' each to the other. Then Mio got a whole lunch into her by having made too much of it, and Nemu ate it as a favour. Mio, alone with you: it only works while she thinks she is rescuing me, and I am out of tricks. You she has not filed yet.':
          '「別當姐姐了。」兩人互相對對方說。然後美緒靠著「做太多了」把一整個便當送進了她嘴裡，ねむ當成幫忙吃掉了。美緒單獨對你說：只有在她以為是在救我的時候才行得通，而我已經沒招了。你她還沒歸檔。',
        'A job Mio cannot do herself':
          '一件美緒自己做不到的差事',
        'Nemu went down avoiding a cat on the morning ride, scraped and with a turned ankle; she happily talked {{user}} through mending her chain with the multi-tool she gave him, fought being carried the whole way home on his back, and then went quiet and told him not to tell anyone.':
          'ねむ早上騎車為了閃一隻貓而摔車，擦傷、腳踝扭了；她很開心地教{{user}}用她送的多功能工具修好鏈條，卻一路抗議被他背回家，然後安靜下來，叫他別告訴任何人。',
        'The club room after class. Urara has lost her grandfather\'s watch and is coming apart about it.':
          '放學後去社團教室。うらら弄丟了她爺爺的手錶，整個人快崩潰了。',
        'A cat out of a hedge, a swerve, and the road. She checked the cat first and the borrowed gym kit second. Asked to talk you through the chain, she taught happily. Offered your back with no reason attached, she fought it the whole way home on a turned ankle, and then went quiet. \'Don\'t tell anyone.\'':
          '一隻從樹籬裡衝出來的貓、一個急轉，和柏油路。她先確認貓，再確認借來的運動服。請她教你怎麼修鏈條，她教得很開心。不帶任何理由地把背讓給她，她拖著扭傷的腳踝一路抗議到家，然後安靜了下來。「別告訴任何人。」',
        'A ride home she did not ask for and could not refuse':
          '一趟她沒開口要、也拒絕不了的回家路',
        'Nemu found Urara\'s lost watch sealed inside a PC case by reading a band-mark and a smear of thermal paste; at the top of her form {{user}} patted her head and said good work, Onee-chan, and she leaned into it and asked him to keep doing it.':
          'ねむ靠一道手環壓痕和袖口的一抹散熱膏，找出うらら的手錶被關在主機殼裡；在她狀態最好的那一刻，{{user}}摸了她的頭說「做得好，姐姐」，而她靠了上去，要他繼續。',
        'A free day on the shopping street. Someone is selling charms to first-years, and Onee-chan is not going to report him.':
          '放假日去商店街。有人在賣護身符坑一年級，而姐姐不打算報警。',
        'A red band-mark, a smear of thermal paste on a cuff, and a phone checked for the time four times in ten minutes. The watch was inside the case. Then a hand on her head at the peak of it — \'Good work, Onee-chan\' — and a voice she has never used: keep doing that. Just for a minute.':
          '一道紅色的手環壓痕、袖口上一抹散熱膏，還有十分鐘內看了四次時間的手機。錶在機殼裡。然後是在她最風光的那一刻落在頭上的一隻手——「做得好，姐姐」——和一個她從沒用過的聲音：繼續。就一分鐘。',
        'A head pat she leaned into, and will deny':
          '一記她靠了上去、並且會否認的摸頭',
        'A charm-seller was fleecing first-years on the shopping street; Nemu used {{user}} as bait to make him guarantee a shrine that is a bus depot, and had him refund the queue and buy everyone crepes; on the walk home she told {{user}} she knew he was trying to work out what she needed, and that she needed nothing.':
          '有個賣護身符的在商店街坑一年級；ねむ讓{{user}}當誘餌，逼他當眾擔保一間根本是公車總站的神社，然後要他退錢給整排隊伍並請大家吃可麗餅；回家路上她告訴{{user}}，她知道他在想她需要什麼，而她什麼都不需要。',
        'She will call you after dark. Answer it, and go to the park.':
          '她入夜後會打電話給你。接起來，然後去公園。',
        'Not a report and not a lecture — a better con run back at him, with you as a wide-eyed idiot with obvious money. The shrine he guaranteed is a bus depot. On the walk home she read you: \'You\'re trying to work out what Onee-chan needs. Onee-chan doesn\'t need anything.\'':
          '不是舉報也不是說教——是用一個更好的局反打回去，由你扮演一個帶著明顯鈔票、毫無判斷力的呆子。他擔保的那間神社是公車總站。回家路上她把你讀了出來：「你在想姐姐需要什麼。姐姐什麼都不需要。」',
        'Crepes, and a very convincing idiot':
          '可麗餅，和一個非常有說服力的呆子',
        'Nemu called {{user}} out at night with nothing wrong — the first call she has ever made for herself; he did not ask what was wrong, she read herself the way she reads a room, found nobody in trouble and said she had called anyway, and asked him, if she calls again, to just come.':
          'ねむ在夜裡把{{user}}叫了出來，什麼事都沒有——她這輩子第一次為自己打的電話；他沒有問出了什麼事，她像讀一個房間那樣讀了自己，發現沒有人有麻煩，說她還是打了，並要他以後她再打來時直接來就好。',
        'Her room, after 19:00. Every broken thing in it belongs to somebody else.':
          '她的房間，十九點以後。那裡每一樣壞掉的東西都是別人的。',
        'A pause on the line far too long, then \'...Can you come out.\' Nothing wrong, and three hours of not pressing the button. You did not ask. \'What does Onee-chan see?\' She read the girl on the bench and found nobody in trouble. \'Nothing\'s wrong. ...I called anyway.\' If Onee-chan calls again, just come.':
          '電話裡一段長得過分的停頓，然後是「……你能出來一下嗎。」什麼事都沒有，還有三個小時按不下去的通話鍵。你沒有問。「姐姐看見了什麼？」她讀了長椅上的那個女孩，發現沒有人有麻煩。「什麼事都沒有。……我還是打了。」姐姐再打來的話，直接來就好。',
        'The first call she ever made for herself':
          '她這輩子第一次為自己打的電話',
        'In a room full of other people\'s repairs with nothing of her own in it, Nemu took the cracked hair tie she had worn since middle school out of her own hair and handed it to {{user}} with her multi-tool; he fixed it and tied her hair up crooked, and she said nobody had ever fixed anything for her in eighteen years.':
          '在一個堆滿別人待修物、卻沒有一樣是她自己的房間裡，ねむ親手把從國中戴到現在、裂了的髮圈從頭髮上取下，連同她的多功能工具一起交給{{user}}；他修好了它，把她的頭髮綁得歪歪的，而她說十八年來沒有人替她修過任何東西。',
        'You fixed the one thing in that room that was hers, and she put your hand back on her head. (series complete)':
          '你修好了那房間裡唯一屬於她的東西，而她把你的手放回自己頭上。（系列完結）',
        'A workshop of other people\'s broken things, every one labelled, and not one of them hers. She stopped her own denial halfway and took the cracked flower hair tie out of her hair herself. \'Fix it. Badly is fine.\' She left the ponytail crooked. \'Onee-chan didn\'t know she was waiting for it.\'':
          '一屋子別人的破東西，每一件都貼了標籤，沒有一件是她的。她的否認說到一半就停了，親手把那只裂了的花形髮圈從頭髮上取下來。「修好它。修得爛也沒關係。」她任由馬尾綁歪。「姐姐不知道自己一直在等這個。」',
        'Her hair tied up crooked, and her hand holding yours there':
          '綁歪的馬尾，和她按在頭上的你的手',
        'Undefeated':
          '不敗',
        'A girl was challenging an entire corridor that had learned to walk around her. You said yes, lost a staring contest, and became entry one in the notebook she keeps the score in.':
          '一個女生在走廊上朝所有人下戰帖，而那條走廊早就學會了繞過她。你答應了，輸了一場瞪眼比賽，成為她記分本上的第一筆。',
        'Haruka Kurusu was challenging an entire corridor that had learned to walk around her; {{user}} said yes, lost a staring contest, and became entry one in a notebook she keeps the score in.':
          '来栖遥香朝一整條早已學會繞過她的走廊下戰帖；{{user}}答應了，輸掉一場瞪眼比賽，成為她那本記分簿上的第一筆。',
        'She said same time tomorrow and did not ask if you were free. The athletic field, after class.':
          '她說了「明天同一時間」，而且沒問你有沒有空。放學後，去操場。',
        'A challenge shouted at a corridor that routed around her three girls at a time, one person who said yes, a staring contest won in forty seconds and celebrated like a cup final, and a battered notebook opened to 1 - 0.':
          '一句朝走廊喊出的戰帖，而人們三個三個地繞過她；一個說好的人；一場四十秒就贏下、卻慶祝得像冠軍賽的瞪眼比賽；還有一本翻開到 1 - 0 的破舊筆記本。',
        'Entry one in her book':
          '她本子上的第一筆',
        'Haruka raced {{user}} on the field until the sun went down, inventing bigger and bigger handicaps to keep it going, while he wrote down his own time after every loss and asked her what he had done wrong.':
          '遥香在操場上和{{user}}賽跑到太陽下山，不斷加碼讓分好讓比賽繼續下去，而他每輸一場就記下自己的時間，問她自己哪裡做錯了。',
        'She has decided a rivalry covering one field is a weak rivalry. Lunch, and bring a pen.':
          '她認為只涵蓋一個項目的對抗是很弱的對抗。午休，記得帶筆。',
        'Beaten by a street, then two out of three, then a ten-metre handicap, then twenty, then thirty — eight races, because the alternative was stopping. After each one you wrote down your own time and asked what you did wrong, and she told you. \'You\'re slow. ...Same time tomorrow.\'':
          '被甩開一條街，然後三戰兩勝，然後讓十公尺，然後二十，然後三十——整整八場，因為不比就得停下來。每跑完一場，你都記下自己的時間，問她你哪裡做錯了，而她都告訴了你。「你很慢。……明天同一時間。」',
        'Eight races and a running total':
          '八場比賽和一筆總帳',
        'Haruka beat {{user}} academically on an outrageous technicality, and when he did not contest it she stopped mid-celebration to ask why he did not fight her on it.':
          '遥香靠一個誇張的程序技術問題在學科上贏了{{user}}，而當他完全沒有爭辯時，她在慶祝到一半停了下來，問他為什麼不跟她爭。',
        'She is bringing a document to your desk at lunch. It is laminated.':
          '午休她會帶一份文件到你桌上。那份文件是護貝的。',
        'A clause on the reverse of the instruction sheet, produced like a barrister, and a win nobody honest would score her. Then he let her have it, and the victory lap stopped halfway. \'...You didn\'t fight that. Why didn\'t you fight that?\'':
          '作答說明背面的一條條款，像律師一樣亮出來，一場任何誠實的計分方式都不會算她贏的勝利。然後他讓她贏了，而勝利繞場走到一半就停住。「……你沒有跟我爭。你為什麼不跟我爭？」',
        'A win on clause 4(b), and a question she could not file':
          '一場靠第四條之二贏來的勝利，和一個她歸不了檔的問題',
        'Haruka presented a laminated 47-event tournament bracket scheduled to the end of next month; the class told her she could just ask him to hang out and she called it a structured rivalry, and when {{user}} asked what happens after event forty-seven she turned it over to a second round.':
          '遥香拿出一張護貝的四十七項錦標賽對戰表，排到下個月底；班上同學說她直接約他出去玩就好，她說這叫有結構的對抗關係，而當{{user}}問第四十七項比完之後呢，她把表翻到了第二輪。',
        'Lunch in the classroom. Somebody is about to start arm-wrestling on the desks, and Yuki Tsukino counts everything.':
          '午休在教室。有人就要在課桌上比起腕力了，而月乃夕紀什麼都會數。',
        'Forty-seven events, hand-ruled and seeded: ice water, plank holds, a controlled overnight environment, spicy food at a restaurant because a kitchen is not a controlled venue. You asked what happens after the last one. She turned it over. Page two, events forty-eight to ninety.':
          '四十七個項目，手繪格線、排好種子：冰水、棒式、受控的過夜環境、在餐廳比吃辣，因為廚房不算受控場地。你問最後一項比完之後呢。她把它翻了過來。第二頁，第四十八到九十項。',
        'A tournament with no final':
          '一場沒有決賽的錦標賽',
        'Yuki beat Haruka twice at arm-wrestling and then counted out loud — two challenges to her this term, nineteen to {{user}} — and asked what that made him; Haruka called him the most efficient available opponent, and when {{user}} asked what she had learned from losing she said there is nothing in a loss.':
          '夕紀比腕力贏了遥香兩次，然後當場算了出來——這學期跟她挑戰兩次，跟{{user}}十九次——並問那他算什麼；遥香說他只是效率最高的對手，而當{{user}}問她從輸裡學到了什麼，她說輸裡面什麼都沒有。',
        'The gates lock at 19:00 and she goes over the fence anyway. The field, after dark.':
          '校門十九點上鎖，而她照樣翻圍牆進去。天黑以後，去操場。',
        'Yuki beat her twice on the desks and then counted: two challenges to Yuki this term, nineteen to you. \'So what\'s he?\' \'Efficient.\' Then your question, the one you ask yourself after every loss, and her answer: \'There\'s nothing IN a loss. You bury it and you win the next one.\'':
          '夕紀在課桌上贏了她兩次，然後算了出來：這學期跟夕紀挑戰兩次，跟你十九次。「那他是什麼？」「效率。」接著是你的問題，你每次輸了都會問自己的那一個，以及她的回答：「輸裡面什麼都沒有。把它埋了，下一場贏回來。」',
        'A number she could not argue with, and an answer you had written down':
          '一個她無法反駁的數字，和一個你早就寫下的答案',
        'Haruka went over the fence to train after dark and found her own shadow running beside her — herself at twelve, in an old middle-school kit, faster, grinning, never once looking back — and could not close a metre of it.':
          '遥香翻過圍牆在天黑後練跑，發現自己的影子跑在身邊——十二歲的她，穿著舊款國中運動服，更快、笑著、一次也沒有回頭——而她連一公尺都追不上。',
        'She went back. She is in worse shape than last time, and she is not telling anyone. The field, after dark.':
          '她又回去了。她的狀態比上次更差，而且沒打算告訴任何人。天黑以後，去操場。',
        'A shadow a beat off her stride, then the wrong size, then beside her with a body attached: twelve years old, old middle-school kit, the same bunny-ear clips, grinning, breathing easy, faster. Lap after lap, sick on the grass, and the child never once looked back. \'...Tomorrow.\'':
          '一個慢了半拍的影子，然後是尺寸不對，然後是跑在身邊、而且有身體連著：十二歲、舊款國中運動服、一樣的兔耳髮夾、笑著、呼吸輕鬆、而且更快。一圈又一圈，吐在草地上，而那孩子一次也沒有回頭。「……明天。」',
        'Second place, to herself':
          '輸給自己的第二名',
        'Haruka raced her twelve-year-old self a second time and lost, and when the child stopped and turned round Haruka understood she had never been racing — she had been slowing at every bend to be caught up with; {{user}} stayed, and in his notebook she found only his own times and what she had taught him, and no score against her at all.':
          '遥香第二次和十二歲的自己賽跑，又輸了，而當那孩子停下轉身時，遥香明白她從來沒有在比賽——她每個彎道都放慢，是為了讓人追上；{{user}}留了下來，而她在他的筆記本裡只找到他自己的時間和她教過他的東西，完全沒有對她的比分。',
        'A free afternoon, no bracket, no wager, no stated event. She has never done this before.':
          '一個放假的下午，沒有賽程表、沒有賭注、沒有指定項目。她從來沒有這樣做過。',
        'The child stopped, turned round, and was only ever waiting. \'I LOST. Why are you still here?\' \'Same time tomorrow.\' Then she read your notebook to prove it was pity: no wins, no losses, only your own times and everything she had taught you. All those wins bought her nothing. You would have come anyway.':
          '那孩子停下來，轉過身，原來一直只是在等。「我輸了。你為什麼還在這裡？」「明天同一時間。」然後她為了證明那是同情而翻了你的筆記本：沒有勝，沒有敗，只有你自己的時間，和她教過你的每一件事。那些勝利什麼也沒替她換到。你本來就會來。',
        'A notebook with no score in it':
          '一本沒有比分的筆記本',
        'Haruka tried to spend an afternoon with {{user}} with no contest in it, failed at it four times, enjoyed twenty minutes without noticing, then raced him to the till and refused to write the result in her book.':
          '遥香試著和{{user}}度過一個沒有任何比賽的下午，失敗了四次，不知不覺享受了二十分鐘，然後和他比賽誰先到櫃檯，並拒絕把結果寫進本子裡。',
        'Race her. She will win it. Watch what she does with the finish line in sight.':
          '和她賽跑。她會贏。看她在終點線就在眼前的時候做了什麼。',
        'No wager, no terms, and no win condition, so she kept trying to install one — four reaches, three caught, and one contest about ice cubes that got out. Then twenty minutes neither of them noticed. \'...That doesn\'t go in the book.\'':
          '沒有賭注、沒有規則，也就沒有勝利條件，所以她一直想裝一個上去——四次伸手，三次收住，還有一場關於冰塊數量的比賽脫口而出。然後是兩個人都沒察覺的二十分鐘。「……那個不列入紀錄。」',
        'The first result she refused to record':
          '她第一次拒絕記錄的結果',
        'Haruka stopped dead three lengths clear with the finish in sight and waited for {{user}}, could only say she did not want it to end — then insisted she meant the race — and wrote her own time in the book instead of a win.':
          '遥香領先三個身位、終點在望時突然停下來等{{user}}，只說得出她不想讓它結束——接著堅稱她說的是比賽——然後在本子裡寫下的是自己的時間，而不是一場勝利。',
        'Her room, after 19:00. The notebook is on the desk with the band off.':
          '她的房間，十九點以後。筆記本就放在桌上，橡皮筋已經拿掉了。',
        'Three lengths clear, the line right there, and she stopped and waited for you. Cramp, tactics, a test, a trip — four answers discarded, and then: \'I didn\'t want it to end. The RACE. Obviously the race.\' What went in the book was not a W. It was her own time.':
          '領先三個身位，終點線就在眼前，她卻停下來等你。抽筋、戰術、測試、絆倒——四個答案都被她自己否決，然後：「我不想讓它結束。比賽啦。當然是說比賽。」寫進本子裡的不是一個 W。是她自己的時間。',
        'A race she gave away for a reason she could not name':
          '一場她為了說不出口的理由讓掉的比賽',
        'In a room full of dusty trophies Haruka read her own tally book and saw it was a dated record of every afternoon with {{user}}; she struck him off her bracket because she had already lost to someone who is not afraid of losing, wrote Kurusu vs Kurusu on today\'s line, and handed him the stopwatch.':
          '在一間擺滿蒙塵獎盃的房間裡，遥香讀了自己的記分本，發現那是和{{user}}度過的每個下午的逐日紀錄；她把他從對戰表上劃掉，因為她早就輸給了一個不怕輸的人，在今天那一行寫下「来栖 對 来栖」，然後把碼錶交給了他。',
        'You started the stopwatch, and she ran against yesterday. (series complete)':
          '你按下了碼錶，而她跑的對手是昨天的自己。（系列完結）',
        'Shelves of trophies nobody has looked at, and a notebook she read for herself: entries on days with no contest at all, just a date and \'walked back\'. She struck you off the bracket — \'I lost to you ages ago, not on a track\' — wrote KURUSU vs KURUSU on today\'s line, and shoved a stopwatch into your chest. \'I want to KEEP you. In the book.\'':
          '一架架沒人再看過的獎盃，和一本她自己讀出來的筆記本：連沒有比賽的日子都有紀錄，只有日期和「一起走回去」。她把你從對戰表上劃掉——「我早就輸給你了，不是在跑道上」——在今天那一行寫下「来栖 對 来栖」，然後把碼錶塞到你胸口。「我想留住你。留在本子裡。」',
        'Off the board, and holding the stopwatch':
          '從對戰表上除名，手裡握著碼錶',
        'One of the Guys':
          '兄弟之一',
        'A girl holding a corridor collected a phone number in front of you, appointed you her rival without asking, and wrote yours on the end of the row with a box drawn around it.':
          '一個霸住整條走廊的女生當著你的面收下別人的電話號碼，沒問過你就指定你當她的對手，然後把你的號碼寫在那一排的最後面，還畫了個框。',
        'Yuki Tsukino collected a girl\'s phone number on the back of her hand in front of {{user}}, appointed him her rival without asking, and wrote his number on the end of the row with a box drawn around it; one of her nails had pink polish scrubbed off badly.':
          '月野夕紀當著{{user}}的面把一個女生的電話號碼寫在自己手背上，沒問過就指定他當她的對手，並把他的號碼寫在那一排的最後、外面畫了一個框；她有一片指甲上的粉紅指甲油被粗糙地刮掉了。',
        'She said the gym, tomorrow, after class. Bring shoes.':
          '她說了體育館，明天，放學後。記得帶鞋。',
        'A corridor held by one girl with three phone numbers in biro on the back of her hand, a shoulder-slap, a rival appointed without asking, and a number written across your arm without her once noticing where she was standing. Yours went on the end of the row, with a box around it. One nail with pink polish scrubbed off badly.':
          '一條被一個女生霸住的走廊，她手背上有三個用原子筆寫的電話號碼，一記拍肩，一個沒問過就指定的對手，還有一個寫在你手臂上的號碼——而她自始至終沒注意到自己站在哪裡。你的號碼寫在那一排的最後，外面畫了一個框。有一片指甲上的粉紅指甲油被粗糙地刮掉了。',
        'A rival you did not apply for':
          '一個你沒申請過的對手身分',
        'Yuki beat {{user}} one-on-one in the gym in front of a fan club with a hand-painted banner, spent the whole game leaning on him without noticing, and had him issued membership card number seven.':
          '夕紀在體育館單挑贏了{{user}}，看台上還有一個掛著手繪布條的粉絲團；整場比賽她都靠在他身上而毫無自覺，最後還讓他領到七號會員證。',
        'A free day in town. She has a bet about phone numbers and she intends to win it.':
          '放假日進城。她有一個關於電話號碼的賭注，而且打算贏。',
        'Six girls on the bleachers under a hand-painted banner, a game lost in every available way, and a forearm and a shoulder and a hand on the hip that were all legitimate basketball. Membership card number seven, in silver pen. \'Same time tomorrow, yeah?\' - with no wager in it at all.':
          '看台上六個女生和一條手繪布條，一場輸得徹徹底底的比賽，還有前臂、肩膀和按在腰上的手——每一下都是正規籃球動作。七號會員證，用銀色筆寫上名字。「明天同一時間，好嗎？」——這句話裡完全沒有賭注。',
        'Membership card number seven':
          '七號會員證',
        'Yuki won a bet about collecting girls\' numbers and checked three times that {{user}} was watching her do it; the one time he missed, her reflection in a cosmetics window was looking at the lipsticks, and when a girl asked if he was her boyfriend she answered half a second too fast, then bought the drinks she had won.':
          '夕紀贏了一場收集女生電話號碼的賭局，分三次確認{{user}}有在看她做這件事；他唯一漏看的那一次，她映在化妝品櫥窗上的倒影正看著口紅架，而被一個女生問到他是不是她男朋友時，她快了半秒才回答，然後買了她贏來的飲料。',
        'She is not right. The gym after class, and she will not say what is wrong with her.':
          '她狀況不對。放學後去體育館，而她不會說自己哪裡不舒服。',
        'She won it smoothly, and checked three separate times that you were watching her do it - and redid the whole approach, louder, when you were not. The once you missed, her reflection was looking at a lipstick stand. Asked if you were her boyfriend, she answered half a second too fast. Then bought the drinks she had already won.':
          '她贏得很漂亮，而且分三次回頭確認你有在看——你沒在看的時候，她把整套搭訕從頭再來一次，更大聲。你唯一漏看的那一次，她映在玻璃上的視線是落在口紅架上。被問到你是不是她男朋友，她快了半秒才回答。然後買了她早就贏到手的飲料。',
        'A bet won, and the drinks bought anyway':
          '贏來的賭注，和照樣自己買的飲料',
        'Yuki tried to play through her period while calling it an abdominal training injury; {{user}} worked it out, said nothing, put a warm drink in her hand and invented a reason the gym was closing, and she leaned on him the whole way to the infirmary and made him swear not to tell anyone.':
          '夕紀生理期還硬要打球，說那是腹部的訓練傷；{{user}}看出來了，什麼都沒說，把一杯溫熱的飲料放進她手裡、編了個體育館要關門的理由，而她一路靠著他走到保健室，還要他發誓不告訴任何人。',
        'Lunch in the classroom. Somebody has started arm-wrestling on the desks.':
          '教室裡的午休。有人在課桌上開起了扳手腕比賽。',
        'Grey in the face, calling it abdominal core strain, refusing to sit out. Then a warm drink, a bag picked up, a gym that was not closing, and her whole weight through your arm the length of the corridor. \'...Don\'t say anything. Ever.\' Three girls had already worked it out, and nothing happened.':
          '臉色發灰，說是腹部核心拉傷，死也不肯下場。接著是一杯溫熱的飲料、一個被提起的包、一間根本沒要關的體育館，還有一整條走廊她把全身重量壓在你手臂上。「……什麼都別說。永遠。」有三個女生早就看出來了，而什麼事都沒發生。',
        'A way out that admitted nothing':
          '一個不必承認任何事的下台階',
        'Yuki won every arm-wrestle in the class including Haruka\'s rematch and counted out loud that Haruka had challenged {{user}} nineteen times; she lost the chest-size contest to every girl in the room, the room forgot it in forty seconds, and asked who would notice if she wore make-up she said the whole town would.':
          '夕紀贏了班上每一場腕力比賽，包括遥香的再戰，還當眾算出遥香挑戰了{{user}}十九次；她在胸圍比賽輸給了房間裡的每一個女生，房間四十秒就忘了這件事，而被問到她如果化妝誰會注意到時，她說全鎮都會。',
        'The mall on a free day. Umi has been planning something for weeks.':
          '放假日去購物中心。羽見已經籌畫好幾個星期了。',
        'Every arm in the class, Haruka\'s rematch included, and a count out loud: nineteen challenges to you, two to her. Then the other contest, lost to every girl in the room and shouted about happily. \'You\'d make such a good boyfriend, Yuki-kun.\' The room forgot it in forty seconds. Asked who would notice if she wore make-up: \'The whole TOWN, bro.\'':
          '全班每一隻手臂，包括遥香的再戰，還有一段當眾算出來的帳：她挑戰你十九次，挑戰她兩次。然後是另一場比賽，輸給了房間裡的每一個女生，而且開開心心地大吵大鬧。「夕紀君，你一定會是個很棒的男朋友。」四十秒後全班就忘了。問她如果化了妝誰會注意到：「全鎮都會，兄弟。」',
        'Every arm in the class':
          '全班的每一條手臂',
        'Umi, Airi and the fan club president ambushed Yuki at the mall and got her into a dress that suited her completely; asked how many people were looking she said everyone, {{user}} counted two, and when he said something plainly kind she fled in the dress and bought it on the way out rather than let Umi win.':
          '海未、愛莉和後援會會長在購物中心埋伏夕紀，讓她穿上了一件完全適合她的洋裝；被問到有多少人在看她時她說全部的人，{{user}}數出來是兩個，而當他說了一句平平淡淡的好話時，她穿著那件洋裝逃了出去，出門時把它買了下來，就為了不讓海未贏。',
        'The arcade on a free day. There is a capsule machine at the back that has not worked since before the staff started.':
          '放假日去電玩遊樂場。最裡面有一台從店員到職之前就壞掉的扭蛋機。',
        'An ambush weeks in the planning, a changing room that sounded like a fight, and a dress that suited her completely. Asked how many people were looking: \'ALL of them.\' You counted two. Then one plain sentence, and game speed out of the shop, and nobody looked up - and she bought it at the counter rather than let Umi win.':
          '一場策劃了好幾週的埋伏，一間聽起來像在打架的試衣間，和一件完全適合她的洋裝。問她有多少人在看：「全部的人。」你數了：兩個。然後一句平平淡淡的話，她用比賽的速度衝出店門，沒有人抬頭——而她在櫃檯把它買了下來，就為了不讓海未贏。',
        'A dress she would not return':
          '一件她不肯退掉的洋裝',
        'A dead capsule machine with its plug on the floor gave Yuki ribbons, lip balm and a charm reading GIRLFRIEND, and gave {{user}} the matching BOYFRIEND half; she looked round the arcade for someone watching, found nobody, put the ribbon in her own hair crooked and asked him to fix it.':
          '一台插頭掉在地上的死掉的扭蛋機給了夕紀緞帶、護唇膏和一個寫著 GIRLFRIEND 的吊飾，又給了{{user}}配對的 BOYFRIEND 那一半；她環顧遊戲場找有沒有人在看，一個也沒有，於是把緞帶歪歪地綁進自己頭髮裡，要他幫她弄正。',
        'The cafeteria at lunch. She will come in braced for a room.':
          '午餐時間的食堂。她會做好面對整個房間的準備走進來。',
        'A capsule machine with its plug lying loose on the floor, and out of it a ribbon, lip balm, a flower clip, three thousand yen of them, and finally a charm reading GIRLFRIEND - with the BOYFRIEND half handed over the moment you put a coin in. She looked round the arcade for the town. Nobody was looking. She put the ribbon in her own hair, crooked. \'...fix it, then.\'':
          '一台插頭鬆脫在地上的扭蛋機，吐出了緞帶、護唇膏、花朵髮夾，三千圓的這些東西，最後是一個寫著 GIRLFRIEND 的吊飾——你一投幣，BOYFRIEND 的另一半就交到了你手上。她環顧整間遊戲場，找那座「全鎮」。沒有人在看。她把緞帶綁進自己頭髮裡，歪的。「……那就幫我弄正。」',
        'The other half of the pair':
          '成對吊飾的另外一半',
        'Yuki came to lunch with uneven eyeliner and the machine\'s lip balm and counted the room waiting for it to react; one girl wiped the smudge off with her thumb and went back to eating, and when Yuki ran her usual flirting routine on her it went hollow and she apologised and moved tables.':
          '夕紀畫著兩邊不一樣的眼線、擦著那台機器的護唇膏來吃午餐，數著整個房間等它有反應；一個女生用拇指把暈開的地方抹掉就回去吃飯，而當夕紀對她跑起平常那套搭訕時，話空掉了，她道了歉，換了桌。',
        'The gym after class. Haruka counts everything, and she has been counting this.':
          '放學後的體育館。遥香什麼都會算，而她一直在算這件事。',
        'Uneven eyeliner and the machine\'s lip balm, and she counted the room herself, waiting for it to turn. One girl wiped the corner off with her thumb and went back to her rice. Then the routine, on muscle memory, and halfway through it went hollow. She apologised and moved tables. \'...She apologised to me. Does she do that?\'':
          '兩邊不一樣的眼線和那台機器的護唇膏，而她自己數了整個房間，等它轉過頭來。一個女生用拇指把暈開的那一角抹掉，然後繼續吃飯。接著是靠肌肉記憶跑出來的那套搭訕，跑到一半就空掉了。她道了歉，換了桌。「……她跟我道歉了。她會這樣嗎？」',
        'A room that did not turn':
          '一個沒有轉過頭的房間',
        'Haruka counted it back at her — forty \'bro\'s to {{user}} this week, one to her — and asked what that made him; Yuki started the technical denial, stopped it herself, and said he is not her rival.':
          '遥香把帳算回給她——這週對{{user}}說了四十次「兄弟」，對她一次——並問她那他算什麼；夕紀開始那套技術性的辯解，自己把它停了下來，說他不是她的對手。',
        'Her room, after 19:00. Look at the back of her hand.':
          '她的房間，十九點以後。看看她的手背。',
        'Forty \'bro\'s to you this week. One to Haruka. \'I\'m your rival. So what\'s he?\' Blank first, then a recount, then anger, then the technical defence - which she stopped herself, mid-sentence. \'...not boku\'s rival. He\'s not that.\' Haruka: \'Obviously. ...Same time tomorrow.\'':
          '這週對你說了四十次「兄弟」。對遥香一次。「我是你的對手。那他是什麼？」先是空白，再來是重算，然後是生氣，然後是那套技術性的辯解——她自己把它停在半句。「……不是我的對手。他不是那個。」遥香：「廢話。……明天同一時間。」',
        'Not her rival':
          '不是她的對手',
        'In Yuki\'s room {{user}} found the dress worn and hanging beside a hoodie, the towel gone from the mirror, the capsule machine\'s GIRLFRIEND charm out on the desk, and one number left on the back of her hand — his, rewritten every morning for four months — and she held the hand out and asked him to write it himself, then told him gym, tomorrow, bring shoes.':
          '在夕紀的房間裡，{{user}}看見那件穿過的洋裝掛在連帽衫旁邊，鏡子上的毛巾不見了，扭蛋機的 GIRLFRIEND 吊飾放在書桌上，而她手背上只剩一個號碼——他的，四個月來每天早上重寫一次——她伸出手要他親手寫上去，然後對他說：體育館，明天，帶鞋子來。',
        'You wrote your number on the back of her hand while she watched. (series complete)':
          '你在她看著的時候，把自己的號碼寫在她手背上。（系列完結）',
        'The dress worn and hanging beside a hoodie, the towel gone from the mirror, the GIRLFRIEND charm out where she can see it from the bed - \'turns out nobody freakin\' cares\' - and one number left on the back of her hand, in the same place, with the same box around it, rewritten every morning for four months. \'You do it. This once. So it\'s yours.\' Then a fist out: gym, tomorrow, bring shoes.':
          '穿過的洋裝掛在連帽衫旁邊，鏡子上的毛巾不見了，GIRLFRIEND 吊飾放在她躺著就看得到的地方——「結果根本沒有人在乎」——而她手背上只剩一個號碼，在同一個位置，畫著同一個框，四個月來每天早上重寫一次。「你來寫。就這一次。這樣它就是你的。」然後伸出拳頭：體育館，明天，帶鞋子來。',
        'Your number, written by you':
          '你的號碼，由你親手寫上',
        'Still':
          '還在',
        'You went back to a dark classroom for something you had left, and the quietest girl in the year was still at her desk, waiting for the building to empty so she could leave without passing anyone.':
          '你回到漆黑的教室拿忘記的東西，而全學年最安靜的那個女生還坐在自己的位子上，等整棟樓空掉，這樣她就能不經過任何人地離開。',
        '{{user}} came back to a dark classroom and found Nene Arisu still at her desk, waiting for the building to empty so she could leave without passing anyone - and the thing he had left behind was squared up in his desk where no cleaning crew would have put it.':
          '{{user}}回到漆黑的教室，發現有栖ねね還坐在座位上，等整棟樓空掉好讓自己能不經過任何人地離開——而他忘記的東西被整整齊齊地放回他的抽屜裡，那不是任何打掃值日生會做的事。',
        'The seat lottery is coming. Homeroom, first thing.':
          '抽座位快到了。晨間的教室，第一件事。',
        'A cleaning crew that stacked the chairs on every desk but hers and worked around her like a cupboard, a girl reading in the dark with headphones in who heard you on the first footstep, and one sentence: \'...I wait until the building\'s empty. Then I can leave without passing anyone.\'':
          '打掃值日生把椅子架上了每一張桌子，唯獨沒有她那張，像繞過一個櫃子一樣繞過她；一個戴著耳機在黑暗裡看書、卻在第一個腳步聲就抬頭的女生；還有一句話：「……我等整棟樓空掉。然後我就能不經過任何人地離開。」',
        'A girl who waits for the building to empty':
          '一個等整棟樓空掉的女生',
        'The seat lottery put {{user}} beside Nene; she said nothing all morning, and when he lost a page reference her notebook slid two centimetres into his sightline with the number written at the top, and slid back, without her once looking up.':
          '抽座位讓{{user}}坐到了ねね旁邊；她整個早上一句話也沒說，而當他找不到頁碼時，她的筆記本往他的視線裡挪了兩公分，頁面最上方已經寫著那個號碼，然後又挪了回去——她一次也沒有抬頭。',
        'The quiet circle keeps a corner of the library after class. Nanoka will tell you where to sit.':
          '放學後，安靜社團在圖書室有個角落。菜乃花會告訴你該坐哪裡。',
        'A slip out of a box, the desk beside hers, and a whole morning of nothing - no greeting, no glance, one degree of her body turned away. Then a lost page reference, and a notebook sliding two centimetres into your sightline with the number already written at the top in the neatest handwriting in the year.':
          '從箱子裡抽出的一張紙條，她旁邊的座位，然後是一整個早上的什麼都沒有——沒有招呼、沒有眼神，只有身體轉開的那一度。接著他漏掉了一個頁碼，而一本筆記本往他的視線裡挪了兩公分，最上方已經用全學年最工整的字寫好了那個號碼。',
        'Two centimetres':
          '兩公分',
        'Nanoka ordered {{user}} to sit with Nene and went back to sleep; he spent an hour in the quiet circle saying nothing, saw her move Nanoka\'s cup out of reach of a sleeping hand, and was told \'...You\'re not going to make me talk? ...That\'s new.\'':
          '菜乃花命令{{user}}去陪ねね坐，然後繼續睡；他在安靜社團裡一句話不說地待了一個小時，看見她把杯子從一隻熟睡的手邊挪開，並被告知：「……你不打算逼我說話嗎？……這倒是新鮮。」',
        'The circle takes tea outside at lunch. Every stray in Jinko knows where she sits.':
          '午休時社團會把茶端到外面去。人光的每一隻野貓都知道她坐在哪裡。',
        'Suzu reading, Urara inside a mechanism, Nanoka asleep and delegating without opening her eyes. Her bag stayed on the chair and nobody asked her to move it. One house rule - \'Don\'t make her talk\' - an hour of nothing, a cup moved an inch from a sleeping hand, and then: \'...That\'s new.\' She packed up and left at a particular minute. \'Rounds,\' said Urara, and nobody asked where.':
          '鈴在看書，うらら埋在一個機械裡，菜乃花睡著了還閉著眼睛指派任務。她的書包一直放在那張椅子上，沒有人叫她移開。只有一條規矩——「別逼她說話」——一個小時的什麼都沒有，一個從熟睡的手邊被挪開一吋的杯子，然後是：「……這倒是新鮮。」接著她在某個固定的分鐘收拾東西走了。「巳邏。」うらら說，而沒有人問她去哪裡。',
        'An hour of nothing, and half a sentence':
          '一小時的什麼都沒有，和半句話',
        'Eleven strays pinned Nene to the courtyard wall because she is the only thing on the grounds that never moves; she whispered \'go, please\' so the circle would not miss fifth period, and the circle sat down instead and missed it with her.':
          '十一隻野貓把ねね釘在中庭的矮牆上，因為她是整片校地上唯一從不亂動的東西；她小聲說了「去吧……拜託」好讓社團不要錯過第五節，而社團選擇坐下來陪她一起錯過。',
        'Urara has a contest, a costume, and a face in mind. After class, wherever Urara has set up.':
          'うらら有一個比賽、一套衣服，還有一張早就想好的臉。放學後，うらら架好東西的地方。',
        'Eleven cats, one asleep on her chest, and a girl too scarlet and too unwilling to disturb them to move a muscle. The bell went, and the only request she has ever made was made for somebody else: \'...Go. ...Please.\' Nanoka said no and lay back down. Five people missed fifth period under a pile of cats.':
          '十一隻貓，其中一隻睡在她胸口，而她臉紅到不行、又捨不得驚動牠們，動彈不得。上課鐘響了，而她這輩子唯一一次開口請求，是為了別人：「……去吧。……拜託。」菜乃花說了「不要」，然後躺了回去。五個人在一堆貓底下錯過了第五節。',
        'One \'please\', spent on somebody else':
          '唯一一次「拜託」，還是為了別人',
        'Urara talked Nene out of the cardigan for a contest photograph; Nene could not perform so she went still, which made the picture perfect, and when Urara posted it to the whole school Nene said nothing at all - because she was watching Urara\'s face rather than the photo.':
          'うらら把ねね哄出了那件大外套去拍比賽用的照片；ねね沒辦法演，所以她整個人靜止下來，而那讓照片完美無瑕——當うらら把照片發給全校時，ねね一個字都沒說，因為她看的是うらら的臉，不是照片。',
        'The photograph went everywhere. Lunch, the classroom, and four girls from another class.':
          '那張照片傳遍了全校。午休，教室，還有隔壁班的四個女生。',
        'No cardigan, and nothing to hide behind. She could not perform for a camera so she went still, and stillness is the one thing a camera wants - the picture was flawless. Urara posted it that night and the whole school saw her by morning, and Nene never said one word about it, because she was looking at Urara\'s face.':
          '沒有了外套，也就沒有了能躲的地方。她沒辦法對著鏡頭表演，於是整個人靜止下來——而靜止正是鏡頭唯一想要的東西，照片完美無瑕。うらら當晚就發了出去，隔天早上全校都看過她了，而ねね一個字也沒說，因為她看的是うらら那張亮起來的臉。',
        'A photograph she never asked to be taken down':
          '一張她從沒要求撤下的照片',
        'Four girls from another class came to look at Nene after the photo and to make her react; Nanoka stood up, Urara took them apart and Suzu told them to leave - and Nene, while the circle was still angry, silently put back every book, figure and cup the fight had knocked over and whispered an apology nobody was meant to hear.':
          '照片之後，隔壁班的四個女生跑來看ねね，想逼她有點反應；菜乃花站了起來，うらら把她們拆得體無完膚，鈴叫她們離開——而ねね趁社團還在生氣的時候，默默把被撞翻的每一本書、每一個模型和每一個杯子都放了回去，然後對著沒有人低聲道了歉。',
        'She has decided the problem is that she can be seen. The park by the station, at dusk - she leaves for somewhere at the same minute every day.':
          '她已經認定問題出在自己會被看見。黃昏時，車站旁的公園——她每天都在同一分鐘出發去某個地方。',
        'Four girls discussing her in the third person while she sat in front of them, and a silence they read as arrogance. Then Nanoka stood up, which Nanoka does not do; Urara took them apart out loud; Suzu said \'She doesn\'t owe you a reaction. Leave.\' And Nene put the room back together and apologised to nobody.':
          '四個女生當著她的面用第三人稱討論她，而她的沉默被讀成了傲慢。然後菜乃花站了起來——菜乃花是不站起來的；うらら當場把她們拆光；鈴說了「她沒有義務給你們反應。出去。」而ねね把整個房間放回原位，並且對著沒有人道歉。',
        'Three friends who stood up, and a room put back':
          '三個挺身而出的朋友，和一個被放回原位的房間',
        'For one day nobody in the school could see Nene, and she spent it quietly doing things for people who could not thank her; {{user}} followed her rounds to the park at dusk and found her feeding fourteen strays she has names for, talking to them in a warm articulate voice nobody at Jinko has ever heard - and the cats could see her.':
          '有一整天，全校沒有人看得見ねね，而她把那一天用來安靜地替那些沒辦法向她道謝的人做事；{{user}}跟著她的「巳邏」走到黃昏的公園，發現她正在餵十四隻都取了名字的流浪貓，用一種人光學園裡從沒有人聽過的、溫暖而流暢的聲音跟牟們說話——而那些貓看得見她。',
        'She is avoiding you. Urara let slip where she goes on the days she is missing from the library corner.':
          '她在躲你。うらら不小心說漏了嘴，讓你知道了她從圖書室角落消失的那些日子都去了哪裡。',
        'Marked absent while sitting four feet from the teacher, a book set down on her arm, a sentence finished to her empty chair - and she tested it all day like a hypothesis without once being frightened. Then the rounds: a park at dusk, a supermarket bag, fourteen cats she has a name for, and a warm funny articulate voice nobody at school has ever heard. \'...They could see me. ...They always could.\'':
          '坐在離老師四步遠的地方被記了缺席，一本書被放在她的手臂上，一句話被說給她的空椅子聽——而她像驗證假設一樣測了一整天，一次也沒有害怕。然後是那趟「巳邏」：黃昏的公園、一袋超市買的飼料、十四隻她都取了名字的貓，以及一種學校裡從沒有人聽過的、溫暖風趣而流暢的聲音。「……牟們看得見我。……牟們一直都看得見。」',
        'A voice nobody at school has heard, and fourteen cats who could always see her':
          '一種學校裡沒人聽過的聲音，和十四隻一直看得見她的貓',
        'Urara let slip where Nene goes on the days she is missing from the library corner: the town library, where she volunteers with a badge on and answers the staff out loud like a person; the anonymous handwritten cards the whole school has been reading are hers, written there for strangers she will never speak to - and {{user}} said nothing, sat in her eyeline and read, and found a card in the book.':
          'うらら說漏了嘴，讓{{user}}知道了ねね從圖書室角落消失的那些日子都在鎮上的圖書館，在那裡戴著志工名牌，並且會出聲回答館員、像一個正常人一樣；全校讀過、卻查不出來源的那些手寫卡片都是她寫的，寫給那些她永遠不會與之交談的陌生人——而{{user}}什麼都沒說，只是坐在她看得見的地方讀書，然後在書裡發現了一張卡片。',
        'The classroom after everyone has gone. The room you first found her in.':
          '人都走光之後的教室。你第一次找到她的那個房間。',
        'A volunteer badge, a returns counter, and a girl who is fast, competent and audible - because nobody in this building has ever asked her to be interesting. And at the end of the counter a stack of blank cards with one half-written: the anonymous notes the whole school has read and nobody could source, in handwriting last seen two centimetres from your elbow.':
          '一張志工名牌、一座還書櫃台，和一個動作快速、熟練、而且說得出話來的女生——因為這棟建築裡從來沒有人要求過她要有趣。而櫃台的尽頭放著一疊空白卡片，其中一張寫到一半：全校都讀過、卻沒人查得出來源的那種匿名字條，用的是不久前才在你手肘旁兩公分處出現過的字跡。',
        'Months of kindness, in her own handwriting, signed by nobody':
          '幾個月份的善意，出自她自己的手，卻沒有署名',
        'In the same dark classroom she was first found in, Nene took one earphone out and set it on the desk between them without a word; there was nothing playing in it, and she told him there never had been.':
          '在最初找到她的那間漆黑教室裡，ねね把一邊的耳機取下來，一句話也沒說地放在兩人中間的桌面上；耳機裡什麼都沒有播，而她告訴他，從來就沒有播過。',
        'The library locks at 19:00. Suzu will tell you she is still inside.':
          '圖書室十九點上鎖。鈴會告訴你她還在裡面。',
        'The same room, the same flat evening light, except the building had emptied twenty minutes earlier and she was sitting there with her book closed and her bag packed, watching the door. One earphone out, set on the desk, no word and no look. Nothing playing in it. \'...There never was.\'':
          '同一個房間，同樣平斜的夕光，只是這次整棟樓在二十分鐘前就空了，而她闔上書、收好書包坐在那裡看著門口。一邊耳機被取下來放在桌上，沒有話也沒有眼神。裡面什麼都沒有播。「……從來就沒有播過。」',
        'One earphone, with nothing in it':
          '一邊耳機，裡面什麼都沒有',
        'Suzu told {{user}} at the gate that Nene was still in the locked library; he found the chair beside her finally empty, and she slid her private journal two centimetres across the table, open at today\'s page, and said \'...I said I\'d die before anyone saw that. ...I\'m still here.\'':
          '鈴在校門口告訴{{user}}，ねね還在已經上鎖的圖書室裡；他發現她旁邊那張椅子終於空了出來，而她把那本私人日記翻到今天那一頁，轉過來往前推了兩公分，然後說：「……我說過我死也不會讓任何人看到那個。……我還在這裡。」',
        'You took the chair beside her and read the page she turned around. (series complete)':
          '你坐上了她旁邊的椅子，讀了她轉過來的那一頁。（系列完結）',
        'One line from Suzu at the gate, a locked library, and the chair beside her empty for the first time since the circle took you in. Then the journal she would die before anyone saw, opened to today, turned around and slid two centimetres - and her hand not going back. \'...I\'m still here. ...You can stay. A little longer.\'':
          '校門口鈴的一句話，一間上了鎖的圖書室，還有自從社團收留你以來第一次空著的那張椅子。然後是那本她死也不肯讓人看的日記，翻到今天，轉過來推了兩公分——而這一次她的手沒有收回去。「……我還在這裡。……你可以留下來。再一下下。」',
        'The other half of the sentence':
          '那句話的另外一半',
        'Everyone\'s Spare':
          '大家的備用',
        'A girl in the row behind handed you a pen with SPARE taped to the barrel, introduced you to the whole class by name, and then did her own work with a pencil stub, because it had been her only pen.':
          '後排的一個女生遞給你一支筆，筆身上用膠帶貼著「備用」兩個字，接著把全班一個一個介紹給你認識——然後她自己用一截短到只剩拇指長的鉛筆寫完了作業，因為那支筆本來是她唯一的一支。',
        'Mio Kagami handed {{user}} a pen with SPARE taped to it, introduced him to the entire class by name without being asked, and could not work out who she had missed with the spare half of a bracelet - then did her own questionnaire with a pencil stub, because the pen had been her only one.':
          '加々美澪遞給{{user}}一支貼著「備用」膠帶的筆，沒人拜託她就把全班都按名字介紹了一遍，還怎麼也想不出來那半條備用手環到底漏了誰——然後自己用一截鉛筆頭寫完了問卷，因為那支筆是她唯一的一支。',
        'Lunchtime in the corridor. Watch what happens when somebody tries to pay her back.':
          '午休時間的走廊。看看有人想要回報她的時候會發生什麼事。',
        'A pen over your shoulder with SPARE on the barrel in masking tape, the whole class handed to you by name in under a minute, and a spare bracelet she dug out of her bag and could not place to anybody. Then she filled in her own questionnaire with a pencil stub worn down to a thumb.':
          '一支從你肩膀上方遞過來的筆，筆身用膠帶貼著「備用」；不到一分鐘，全班就被一個一個按名字交到你手上；還有一條她從包包裡翻出來、卻怎麼也想不出該給誰的備用手環。然後她用一截短到只剩拇指長的鉛筆寫完了自己的問卷。',
        'A pen that had been her only pen':
          '一支原本是她唯一的筆',
        'Three girls tried to pay Mio back in the hallway and none of them could take their gift back - their fingers would not close - and she carried all three away to pass on, then admitted she has no idea what she would choose for herself.':
          '三個女生在走廊上想把人情還給澪，結果沒有一個人收得回自己的東西——手指就是合不起來——她只好把三樣全都抱走再轉送出去，然後承認自己根本不知道要替自己挑什麼。',
        'Noon in the cafeteria. Every table has saved her a seat.':
          '正午的食堂。每一張桌子都幫她留了位子。',
        'A bottle of tea, a hair clip and a packet of tissues, each pressed on her \'for the other day\', each refused, and each hand simply refusing to close again. She carried all three away like somebody else\'s laundry. \'I don\'t know what I\'d pick for myself. Isn\'t that funny? I know what everyone else drinks.\'':
          '一瓶茶、一個髮夾、一包面紙，每一樣都以「前幾天謝謝你」的名義塞過來，每一樣都被她推回去，而每一隻手就是再也合不起來。她把三樣東西像別人的衣服一樣抱走了。「我不知道自己會挑什麼耶。很好笑對不對？別人喝什麼我都記得。」',
        'Three gifts she was not allowed to refuse':
          '三份她推不掉的謝禮',
        'Thirty tables saved Mio a seat and she could not sit at any of them; the chairs slid into the aisle after her and she ate standing up, until {{user}} carried his tray in and stood there with her.':
          '三十張桌子都幫澪留了位子，而她一張也坐不了；椅子自己滑進走道跟著她，她就這樣站著吃完，直到{{user}}端著餐盤走進來，站在她旁邊。',
        'A snack run in town after class. She invited you along like it was nothing.':
          '放學後進城買零食。她像沒事一樣就把你一起找去了。',
        'Thirty hands patting thirty saved chairs, and a girl who cannot sit at one table because that means standing up from twenty-nine. Then the chairs scraped back on their own and slid into the aisle after her, and she ate standing in a ring of them - until somebody carried his tray in and stood there too.':
          '三十隻手拍著三十張留好的椅子，而一個女生坐不了任何一張，因為坐下其中一張就等於從另外二十九張站起來。然後那些椅子自己往後一推，滑進走道跟著她，她就站在一圈椅子中間吃飯——直到有人端著餐盤走進那一圈，也站著。',
        'A ring of thirty chairs, and one person standing in it':
          '一圈三十張椅子，和站在裡面的那一個人',
        'Six plates slid across a restaurant table at Mio at once and she pushed every one of them back; asked what she would order if she came alone, she admitted she has never been anywhere alone and does not know what she would pick.':
          '餐廳裡六個盤子同時往澪那邊滑過去，她把每一個都推了回去；被問到如果一個人來會點什麼，她承認自己從來沒有一個人去過任何地方，也不知道會點什麼。',
        'A dodgeball game on the grounds at lunch. Somebody else set it up.':
          '午休時操場上的躲避球。是別人揪的局。',
        'Six girls, one booth, and Mio on a chair at the open end because she gave her seat away. \'Whatever\'s fastest\' - she has said that since she was small and does not have an order. Then six plates slid at her at once and she pushed them all back. Asked what she would order alone: \'...I\'ve never been anywhere alone. I don\'t know.\'':
          '六個女生、一個卡座，而澪坐在開口那端的椅子上，因為她把位子讓出去了。「最快上的那個就好」——她從小就這樣說，她沒有固定要點的東西。然後六個盤子同時往她那邊滑過來，她一個一個推回去。被問到一個人來會點什麼：「……我從來沒有一個人去過任何地方。我不知道。」',
        'A question she could not answer':
          '一個她答不出來的問題',
        'A dodgeball game collapsed to thirty-nine against one as the whole far team slid onto Mio\'s side, Natsuhi Misora among them; Natsuhi looked across at the one person the pull never moved and said \'your friend doesn\'t slide\', and Mio did not know what she meant.':
          '一場躲避球比賽變成了三十九比一，因為對面整隊都滑到了澪這一邊，美空なつひ也在裡面；なつひ望向那個唯一沒被拉動的人，說了一句「你朋友不會滑過來」，而澪完全不懂她在說什麼。',
        'The classroom after the last bell. There is a queue.':
          '最後一節下課後的教室。外面排了一條隊。',
        'Twenty a side, and then the far team\'s heels began to drag across the line until it was thirty-nine to one. The thirty-ninth was Natsuhi Misora, who does not play games, arriving at walking pace with her collar straight. She looked across at the only person who had not moved. \'...Your friend doesn\'t slide.\' \'Slide?\'':
          '一邊二十人，然後對面的腳跟開始拖過中線，直到變成三十九比一。第三十九個是從不參加團體活動的美空なつひ，她以走路的速度滑過來，領口還整整齊齊。她望向那個唯一沒有動的人。「……你朋友不會滑過來。」「滑？」',
        'Thirty-nine to one, and one who did not slide':
          '三十九比一，和那個沒有滑過來的人',
        'Every girl in the building queued to give Mio a pen back and she thanked each of them by name without a single mistake; then she sat in the emptied room taping SPARE onto all of them so she could give them away again, and when {{user}} said she could keep one she asked which one.':
          '全校每一個女生都排隊來還澪一支筆，而她一個不錯地叫出了每一個人的名字；然後她坐在空掉的教室裡，把「備用」一張一張貼回那些筆上，好再送出去——{{user}}說她可以留一支，她問：「留哪一支？」',
        'The courtyard at four. The whole building is square with her now, and nobody needs anything.':
          '四點的中庭。整棟樓的人情都還清了，沒有人需要她做任何事。',
        'A queue from her desk to the stairs, every girl laying down a pen and saying \'for the other day\', including the ones she has never helped. She got every name right, and not one of them knew her favourite anything. Afterwards she taped SPARE onto all of them to give away again. \'She could keep one.\' \'Which one?\'':
          '一條從她桌前排到樓梯口的隊伍，每個女生放下一支筆，說一句「前幾天謝謝你」，連她從沒幫過的人也來了。她每一個名字都叫對了，而沒有一個人知道她喜歡什麼。之後她把「備用」貼回每一支筆上，好再送出去。「你可以留一支。」「留哪一支？」',
        'Every name in the building, right':
          '整棟樓的名字，一個也沒錯',
        'The whole building settled its debt to Mio at once and then needed nothing from her, and she stood in an emptying courtyard holding out pens nobody would take; {{user}} told her he had never owed her anything and had come anyway, and she had no answer for it.':
          '整棟樓一次還清了欠澪的所有人情，然後就再也不需要她了；她站在漸漸空掉的中庭裡，舉著沒有人要接的筆。{{user}}告訴她，自己從來沒有欠過她什麼，卻還是來了——而她答不上一個字。',
        'She has an answer at last, three weeks late. The gate at four, and the shopping street.':
          '她終於有了答案，遲了三個星期。四點的校門口，還有商店街。',
        'Everyone square, everyone still saying hello, and nobody needing a thing - benches with pens on them and no people. \'If nobody needs anything, why would anyone come find me?\' Then the one person the pull had never moved told her he had never owed her a pen, a seat or a favour, and had come out here anyway. Not repaid. Chosen.':
          '所有人都兩清了，所有人還是熱情地跟她打招呼，而沒有人需要任何東西——長椅上放著筆，卻沒有人。「如果沒有人需要任何東西，那還有誰會來找我？」然後那個從來沒被拉動過的人告訴她，他從來沒有欠過她一支筆、一個位子或一份人情，而他還是走到這裡來了。不是還人情。是選擇。',
        'Somebody who never owed her anything':
          '一個從來沒欠過她什麼的人',
        'Mio finally wanted something for herself - a cafe on the shopping street - and asked for it in the plural, so the entire school came; she gave her place away down the whole queue until the last seating went to the girl in front of her, and never got in.':
          '澪終於有了一件想要的事——商店街上的一家新咖啡店——而她用複數問了出來，於是全校都跟著去了；她一路把自己的位置讓給後面的人，直到最後一輪座位給了排在她前面的那個女生，而她始終沒有進去。',
        'The corridor at four. The whole school is waiting for her to ask them for something.':
          '四點的走廊。全校都在等她開口跟他們要點什麼。',
        'The first thing she has ever wanted that was not for somebody else, and she asked for it the only way she knows: \'Does anyone want to try the new cafe?\' The whole school went, and the queue wrapped the block, and she gave her place away down the length of it until the last seating went to the girl in front of her. \'You said anyone.\'':
          '她這輩子第一件不是為了別人而想要的事，而她只會用一種方式說出口：「有沒有人想去那家新開的咖啡店？」全校都去了，隊伍繞了整個街區，而她沿著隊伍一路把位置讓出去，直到最後一輪座位給了排在她前面的那個人。「你說的是『有沒有人』。」',
        'A want, said in the plural':
          '一個用複數說出口的願望',
        'A hallway full of girls stood waiting for Mio to ask them for something, and she walked the length of it past every one of them and said \'You. Not anyone. You.\' - and the whole corridor emptied without a single hard feeling.':
          '一整條走廊的女生站著等澪開口跟她們要點什麼，而她走完了整條走廊，越過所有人，說了一句「是你。不是誰都可以。是你。」——然後整條走廊散了，沒有一個人不高興。',
        'The cafe on the shopping street. A table for two.':
          '商店街上的那家咖啡店。一張兩人桌。',
        'A corridor packed wall to wall with girls who had no reason to be there, waiting to be asked. She walked the whole length of it, thanking people by name, past every single one - and stopped. \'You. Not anyone. You.\' The hallway lifted like a flock and went home, and nothing broke. The pull was never a chain; it was waiting to be pointed.':
          '一條擠得水泄不通、卻沒有一個人有理由站在那裡的走廊，全都在等她開口。她走完了整條，一路叫著名字道謝，越過每一個人——然後停下來。「是你。不是誰都可以。是你。」整條走廊像鳥群一樣散開回家了，什麼也沒有壞掉。那股拉力從來就不是鎖鏈，它只是在等她指一個方向。',
        'One syllable':
          '一個字',
        'At a table for two Mio ordered first for the first time in her life, then took the spare bracelet out of her bag and explained that a spare is for anybody and this one only goes to one person; {{user}} held out his wrist and said nothing, and it took her three tries at the clasp.':
          '在一張兩人桌前，澪這輩子第一次先點了自己的餐，然後從包包裡拿出那條備用手環，說備用的意思就是誰都可以拿，而這一條只能給一個人；{{user}}伸出手腕，一句話也沒說，而她試了三次才扣上。',
        'You held out your wrist, and she got the clasp on the third try. (series complete)':
          '你伸出了手腕，而她試到第三次才扣上。（系列完結）',
        'A table for two, no aisle, nobody saving her a seat. \'You first,\' and she ordered without looking at anyone else\'s menu. Then the other bracelet came out of her bag: a spare is a thing anybody can have, and this one only goes to one person, and one person can not-pick you back. A wrist held out, held still, and three tries at the clasp.':
          '一張兩人桌，沒有走道，也沒有人幫她留位子。「你先。」於是她沒有看別人的菜單就點了自己的。然後另一條手環從包包裡拿了出來：備用的意思是誰都可以拿，而這一條只能給一個人，而一個人是會不選你的。一隻伸出來、穩穩不動的手腕，和三次才扣上的扣環。',
        'Not spare - pair':
          '不是備用——是一對',
        'Extremely Normal':
          '非常普通',
        'The girl in the back corner fixed your phone in forty seconds without looking at you, while the stapled document on her desk read BOY OBSERVATION LOG - Vol. 1, Subject: (there is one). She says the keychain on her bag is from a normal anime.':
          '後排角落的女生看都沒看你一眼，四十秒就把你的手機修好了，而她桌上那份釘好的文件寫著「男生觀察日誌——第一卷，觀察對象：（有一個）」。她說包包上的吊飾是出自一部普通的動畫。',
        'Urara Yamabuki fixed {{user}}\'s frozen phone in forty seconds without looking at him, while a stapled document on her desk read BOY OBSERVATION LOG - Vol. 1, Subject: (there is one); she whispered to her friends not to move because \'he approaches when you don\'t move\', said the towel-girl keychain on her bag was from a normal anime, and wrote him down as pre-route.':
          '山吹うらら看都沒看{{user}}一眼，四十秒就修好了他當機的手機，而她桌上一份釘好的文件寫著「男生觀察日誌——第一卷，觀察對象：（有一個）」；她小聲叫朋友別動，因為「你不動他就會靠過來」，說包包上那個裹著浴巾的女生吊飾是出自一部普通的動畫，然後把他記成「尚未進入路線」。',
        'The hallway corner by the stairs, first thing in the morning. Somebody is counting down.':
          '一早樓梯旁的走廊轉角。有人在倒數。',
        'A phone fixed in forty seconds by a girl who never looked up, a document on her desk titled BOY OBSERVATION LOG with one subject, and a whisper to her friends not to move. \'Same class. You know the class. You\'re in it. I\'m documenting.\' The keychain on her bag is a girl in a very small towel. \'From a normal anime.\'':
          '一個從頭到尾沒抬頭的女生四十秒修好了一支手機，她桌上一份標題是「男生觀察日誌」的文件，觀察對象只有一個，還有一句叫朋友別動的耳語。「同班的。你知道哪一班，你就在裡面。我在做記錄。」她包包上的吊飾是一個裹著小小浴巾的女生。「普通動畫的。」',
        'A working phone, and a chapter you are in':
          '一支修好的手機，和一個有你在裡面的章節',
        'Urara ran a hallway corner blind with toast in her mouth to trigger the collision event from chapter two of her Log, and {{user}} sidestepped; she hit the floor alone, he looked away, and Suzu recorded the finding as \'subject deviates from text\'.':
          'うらら嘴裡叼著吐司、閉著眼睛衝過走廊轉角，想觸發日誌第二章的「相撞事件」，而{{user}}側身讓開了；她一個人摔在地上，他別開了視線，而鈴把結論記成了「觀察對象偏離文本」。',
        'Lunch on the grounds. She has not slept.':
          '午休時的操場。她整晚沒睡。',
        'Toast from home, eyes shut, a dead sprint round the corner - and a sidestep. She hit the floor alone with her socks at the ceiling, and he looked away. \'In the source material they don\'t look away.\' Suzu wrote the finding: subject deviates from text. Not the text. The subject.':
          '從家裡帶來的吐司、閉上的眼睛、全速衝過轉角——然後一個側身。她一個人摔在地上，襪子朝著天花板，而他別開了視線。「原作裡的男生不會別開視線。」鈴寫下了結論：觀察對象偏離文本。不是文本錯了。是觀察對象。',
        'Subject deviates from text':
          '觀察對象偏離文本',
        'Urara collapsed on the grounds after an all-night release and {{user}} carried her to the infirmary; her circle lined up outside the curtain to ask whether the event had started, she narrated chapter four from behind the blanket, and he put a bottle of water by the bed, sat outside, and asked if she wanted the window open.':
          'うらら熬夜等新作發售之後在操場上昏倒，{{user}}把她抱到了保健室；她的小圈子在簾子外排成一排問「事件開始了嗎」，她躲在毯子後面把第四章背了一遍，而他在床邊放了一瓶水、坐到簾子外面，問她要不要開窗。',
        'Lunch in the cafeteria. Suzu wants a second source.':
          '午休時的食堂。鈴想要第二個資料來源。',
        'Carried to the infirmary after an all-night release, and her friends lined up outside the curtain to ask if the event had started. Behind the blanket she narrated chapter four in a rising whisper - and what came through the curtain was a bottle of water and a question about the window. \'...In the games the boy never asks about the window.\'':
          '熬夜等新作發售之後被抱進保健室，而她的朋友們在簾子外排成一排，問事件開始了沒有。她躲在毯子後面、用越來越大聲的耳語把第四章背了一遍——而穿過簾子送進來的，是一瓶水，和一句要不要開窗。「……遊戲裡的男生從來不會問窗戶的事。」',
        'A question about the window':
          '一句關於窗戶的問題',
        'Suzu demanded a second source for the Log, so Urara interviewed Airi Kuraha for thirty minutes in the cafeteria; Airi improvised every answer, Vol. 2 came out as two columns that disagree on everything, and {{user}} heard all of it from the next table without any of them noticing.':
          '鈴要求日誌要有第二個資料來源，於是うらら在食堂訪問了倉葉アイリ三十分鐘；アイリ每一個答案都是現編的，第二卷變成了兩欄互相矛盾的紀錄，而{{user}}在隔壁桌從頭聽到尾，沒有一個人發現。',
        'The library after four. Suzu has a question for the Log.':
          '四點以後的圖書館。鈴有一個問題要問日誌。',
        'Two sources is the standard, so the circle interviewed Airi Kuraha for thirty minutes with a prepared list. Routes were buses. Biting was corroborated. Taking a hand involved a shoulder roll. Vol. 2 is two columns that disagree on everything, and the subject ate his lunch at the next table the whole time.':
          '兩個來源才算標準，所以小圈子拿著準備好的題目訪問了倉葉アイリ三十分鐘。路線變成了公車路線。「會上鉤」得到了佐證。牽手的步驟裡有一個轉肩膀的動作。第二卷是兩欄從頭到尾互相矛盾的紀錄，而觀察對象整段時間都在隔壁桌吃午餐。',
        'Vol. 2, in two columns':
          '第二卷，分成兩欄',
        'Suzu asked Urara what happens afterward, precisely, and Urara told the circle with total authority that it is like a rhythm game and the girl is intense and passes out every time; Nene asked on a slip of paper whether it hurts, and {{user}} heard the whole lecture from the next aisle.':
          '鈴問うらら「之後究竟會發生什麼」，うらら用十足的權威告訴小圈子那就像節奏遊戲、女生會很激烈、每次都會昏過去；ねね用紙條問會不會痛，而{{user}}在隔壁書架把整堂課聽完了。',
        'After school, the shopping street. She wants to verify chapter eight, and the circle is coming.':
          '放學後的商店街。她想驗證第八章，小圈子也要跟來。',
        '\'What happens. Precisely. Afterward.\' And she told them: like a rhythm game, and the girl is intense, and the text box shakes, and she passes out every time. Nene asked on a slip whether it hurts. Suzu said in the Brontës they close the door. Then she turned round and he was at the end of the aisle. \'...Which manga?\' \'...A normal one.\'':
          '「之後。究竟。會發生什麼。」於是她告訴她們：就像節奏遊戲，女生會很激烈，對話框會晃，而且每一次都會昏過去。ねね用紙條問會不會痛。鈴說勃朗特姊妹的小說裡都是把門關上。然後她一轉頭，他就站在書架那頭。「……哪一部漫畫？」「……普通的那種。」',
        'A lecture, attended':
          '一堂有人旁聽的課',
        'Urara ran chapter eight of the Log on {{user}} with the circle escorting the date down the shopping street; he won the crane game first try, bought two crepes, and rode the station elevator twice for the ferris wheel step, and at the bus stop nothing faded and Nene\'s sign said END?':
          'うらら帶著小圈子沿商店街押送約會，在{{user}}身上執行了日誌第八章；他第一次就抓到了娃娃、買了兩份可麗餅、為了摩天輪那一步搭了兩趟車站電梯，而在公車站什麼也沒有淡出，ねね的牌子上寫著「結束？」',
        'Morning, the classroom. Vol. 2 got out.':
          '早上的教室。第二卷外流了。',
        'Chapter eight, in order: fail the crane game three times, one crepe two mouths, a ferris wheel, and then the scene fades. He won the crane first try, bought two crepes, and rode the station elevator twice. At the bus stop nothing faded. \'...It didn\'t fade.\' Nene\'s sign, turned round: END?':
          '第八章，依序：抓娃娃機要先失敗三次、一份可麗餅兩張嘴、摩天輪、然後畫面淡出。他第一次就抓到了，買了兩份可麗餅，搭了兩趟車站電梯。在公車站什麼也沒有淡出。「……沒有淡出。」ねね把牌子翻過來：結束？',
        'A plush cat, won on the first try':
          '一隻第一次就抓到的絨毛貓',
        'Vol. 2 leaked and the whole class performed a heroine type each at {{user}} at once, by seating chart, while Urara stood on a chair shouting that that is not how routes work; asked where the table came from she told the whole room \'a normal manga\', and afterwards he handed her the photocopy folded to the footnote with the game\'s title in it, and said nothing.':
          '第二卷外流了，全班照著座位表、每人扮演一種女主角類型，同時一起對{{user}}演了出來，而うらら站在椅子上大喊路線不是這樣運作的；被問到那張表是哪裡來的，她對全班說「普通的漫畫」，事後他把影本摺到那條寫著遊戲名稱的註腳遞給她，什麼也沒說。',
        'Her house after four. She needs a second pair of hands, and the circle is coming in support.':
          '四點以後她家。她需要多一雙手，小圈子也要跟來「支援」。',
        'The class performed one heroine type each at him, all at once, by seating chart, while she stood on a chair shouting that the flags cancel out. Asked where the table came from, she told the whole room \'a normal manga\'. Afterwards he handed her the photocopy, folded to the footnote with the game\'s title in it, and said nothing. He had known since the library.':
          '全班照著座位表、每人一種女主角類型，同時一起對他演了出來，而她站在椅子上大喊旗標會互相抵消。被問到那張表是哪裡來的，她對整間教室說「普通的漫畫」。事後他把影本摺到那條寫著遊戲名稱的註腳遞給她，什麼也沒說。他從圖書館那天就知道了。',
        'A footnote, in nine-point':
          '一條九號字的註腳',
        '{{user}} helped Urara seat a graphics card in her room while the circle sat in her living room in support; she turned every figure to face the wall and taped a tissue-paper towel on the last one, then put his tea down on a game case, and when he asked which route had the better writing she answered for forty minutes and cried.':
          '{{user}}在うらら房間裡幫她裝顯示卡，小圈子坐在她家客廳「支援」；她把每一尊模型都轉過去面對牆壁、在最後一尊身上貼了一條面紙浴巾，然後把他的茶放在一個遊戲盒上，而當他問哪條路線寫得比較好時，她講了四十分鐘，哭了。',
        'The library after four. She has one page to read to the circle.':
          '四點以後的圖書館。她有一頁要念給小圈子聽。',
        'Every figure turned to the wall, a tissue-paper towel taped on the last one, and his tea set down on a game case - the one she missed. She froze for the face she has feared since she was thirteen, and he read the back of the case and asked which route has the better writing. Forty minutes, and crying by the fan-disc. From downstairs: \'Has it started?\'':
          '每一尊模型都轉過去面對牆壁，最後一尊身上貼著面紙做的浴巾，而他的茶被放在一個遊戲盒上——她漏掉的那一個。她僵在那裡，等著從十三歲起就害怕的那張臉，而他翻過盒子讀了背面，問哪條路線寫得比較好。四十分鐘，講到粉絲碟的時候哭了。樓下傳來：「開始了嗎？」',
        'Which route has the better writing':
          '哪一條路線寫得比較好',
        'Urara read Vol. 3 - Errata to the circle, the source of every prior volume, and the circle had no idea what an 18+ game was and asked only whether it was still reliable; she admitted she knows nothing herself, dictated the only true pages - what {{user}} actually did - and then, told he was behind her, asked him to come and see her shelf face-out.':
          'うらら把「第三卷——勘誤」念給小圈子聽，也就是前面每一卷的來源，而小圈子根本不知道十八禁遊戲是什麼，只問了一句還可不可靠；她承認自己其實什麼都不知道，口述了唯一真實的幾頁——{{user}}實際做過的事——然後在被告知他就在身後時，請他來看她面朝外的那面架子。',
        'Her room, one week on. Everything face-out.':
          '一星期後她的房間。全部面朝外。',
        'Vol. 3 - Errata, read standing: the source of every volume. And the circle had no frame for it - \'a game, with writing\', \'so it\'s a book\', \'is it still reliable\'. So she gave them the real answer: she doesn\'t know. Any of it. Then the only true pages - what he actually did - and Suzu titled them Vol. 3. \'He\'s behind you.\' \'That\'s a chapter two event.\' It was.':
          '「第三卷——勘誤」，站著念完：每一卷的來源。而小圈子完全沒有概念——「一個遊戲。有劇情的。」「那就是一本書嘛～」「還可靠嗎」。於是她給了她們真正的答案：她不知道。全部都不知道。然後是唯一真實的幾頁——他實際做過的事——鈴把它們題為第三卷。「他在你後面。」「那是第二章的事件。」結果是真的。',
        'The first volume with a source':
          '第一卷有來源的日誌',
        'In Urara\'s room with every poster face-out for the first time, she showed {{user}} the protagonist figure with no face, gave him a second controller, deleted her own 100% clear file of the game from the coaster without a second look, started a new game, and left the name field blank until he typed his own; \'he doesn\'t have a face, that\'s how you know it\'s you\', said to the screen as the letters came in.':
          '在うらら每一張海報第一次全部面朝外的房間裡，她給{{user}}看了那尊沒有臉的主角模型，把第二支手把交給他，看也不看第二眼就刪掉了自己那個杯墊遊戲的100%通關存檔，開了新遊戲，然後把名字欄空著，直到他輸入了自己的名字；「他沒有臉，所以你才知道那是你」，是在字母一個一個打進去的時候對著螢幕說的。',
        'He doesn\'t have a face. That\'s how you know it\'s you. (series complete)':
          '他沒有臉。所以你才知道那是你。（系列完結）',
        'Every poster face-out, the towel off the bath-scene girl, a protagonist figure with no face on the shelf and a plush cat at his feet. A second controller, sealed. Then her 100% clear file - five years of afternoons alone - deleted without a second look, NEW GAME, and a blank name field she would not type in. He typed. \'He doesn\'t have a face. That\'s how you know it\'s you.\'':
          '每一張海報都面朝外，泡澡少女身上的浴巾拿掉了，架子上一尊沒有臉的主角模型，腳邊一隻絨毛貓。一支還沒拆封的第二支手把。然後是她那個100%通關的存檔——五年一個人的下午——看也不看第二眼就刪掉了，新遊戲，和一個她不肯輸入的空白名字欄。他輸入了。「他沒有臉。所以你才知道那是你。」',
        'A new file, with his name on it':
          '一個寫著他名字的新存檔',
        'This One\'s Me':
          '這個才是我',
        'A girl came down the stairwell banister, landed in front of you, circled you twice, smelled you, and demanded to know why there is a boy in her school. Then she ate your lunch and announced she would make you leave.':
          '一個女生從樓梯扶手上滑下來，落在你面前，繞著你轉了兩圈、聞了聞你，然後質問為什麼她的學校裡會有一個男生。接著她吃掉了你的午餐，並且宣布她要把你趕走。',
        'Iori Sekita dropped off the stairwell banister in front of {{user}}, circled him twice, smelled him, demanded to know why a boy is in a girls\' school, announced she would make him leave - then took the meat bun out of his hand and ate it in front of him.':
          '関田いおり從樓梯扶手上落到{{user}}面前，繞著他轉了兩圈、聞了聞他，質問為什麼女校裡會有一個男生，宣布她要把他趕走——然後從他手上拿走肉包，當著他的面吃掉了。',
        'The classroom at lunch. She has started on your desk.':
          '午休的教室。她已經佔到你的桌子上了。',
        'Something came down the banister at full speed and landed in front of you: crimson hair, leggings, no concept of standing further away than four centimetres. She circled you twice and smelled you, because a boy in a girls\' school does not compute. \'I don\'t like you. I\'m gonna make you leave.\' Then she ate your meat bun, watching your face.':
          '有東西全速從扶手上滑下來，落在你面前：緋紅色的頭髮、內搭褲，以及完全沒有「站遠一點」這個概念。她繞著你轉了兩圈還聞了聞你，因為女校裡有個男生這件事算不過來。「我不喜歡你。我要把你趕走。」然後她吃掉了你的肉包，全程盯著你的表情。',
        'A declaration of war, and half a meat bun':
          '一份宣戰，和半個肉包',
        'Iori spent a week taking {{user}}\'s lunch, his desk and finally his chair to drive him out of the school; on the last day of it he brought two lunches and put one in front of her, and she demanded to know why he was not angry.':
          'いおり花了一個星期搶{{user}}的午餐、他的桌子、最後連他的椅子都佔了，就為了把他趕出學校；最後一天他帶了兩份午餐，把其中一份放到她面前，而她質問他為什麼不生氣。',
        'The hallway at lunch. She has escalated.':
          '午休的走廊。她升級了。',
        'The first day half your lunch, by the third all of it, then your desk, and by the end of the week your chair with her feet up while you stood. Every day she watched your face for the part where you got angry. On the last day of it you brought two lunches and put one in front of her. \'What is this.\' \'Lunch.\' \'You\'re supposed to be MAD.\' She turned the box round looking for the trick.':
          '第一天半份午餐，第三天整份，接著是你的桌子，到了週末她翹著腳坐在你的椅子上吃、而你站著。每一天她都盯著你的臉，等你生氣的那一刻。最後一天你帶了兩份午餐，把一份放到她面前。「這是什麼。」「午餐。」「你應該要生氣才對。」她把便當盒翻來覆去，找裡面的陷阱。',
        'A campaign that got no reaction':
          '一場沒有得到任何反應的戰役',
        'Iori pinned {{user}} to the hallway lockers nose-to-nose to order him out of the school, with no idea how it looked to the corridor full of girls watching; he told her he simply goes here, and Sui arrived and scolded her for something entirely different.':
          'いおり把{{user}}抵在走廊的置物櫃上、鼻尖對鼻尖地命令他滾出學校，完全不知道在滿走廊圍觀的女生眼裡那是什麼樣子；他告訴她自己就是這間學校的學生，然後すい出現了，為了完全不同的另一件事訓了她一頓。',
        'The grounds after school. She has decided to chase you.':
          '放學後的操場。她決定要追你了。',
        'Forearm across your collarbone, four centimetres from your face, pressed flat against you from the collarbone down and entirely unaware of it, ordering you to leave. The whole corridor stopped and read it the other way, and she was the only person present who did not know. Then Sui arrived, and she and Iori had two completely different conversations at volume.':
          '前臂橫在你的鎖骨上，臉離你四公分，從鎖骨以下整個貼在你身上而她毫無自覺，命令你離開。整條走廊都停了下來，並且一致地讀成了另一個意思，而她是在場唯一不知道的人。然後すい出現了，她和いおり兩個人用同樣的音量進行著兩場完全不同的對話。',
        'A handkerchief and somebody else\'s lecture':
          '一條手帕，和一頓不是給你的訓話',
        'Iori spent an afternoon hunting {{user}} across the school grounds by roof, wall and tree branch, and he walked to the bus at his usual speed the entire time; she ended up walking beside him to the gate, furious, ordering him to run.':
          'いおり花了一個下午在校園裡追捕{{user}}，走屋頂、走圍牆、盪樹枝，而他全程用平常的速度走去公車站；最後她只能一路氣沖沖地陪他走到校門口，命令他快跑。',
        'The gym at four, and the sky has gone the colour of a bruise.':
          '四點的體育館，天空已經變成瘀青的顏色。',
        'Bike shed roof to wall to tree branch, cutting you off at every turn between the classroom block and the gate - and you walked to the bus at the speed you walk to the bus. Prey that does not flee is not prey. By the gate she was simply walking beside you, furious, at the slowest pace she has moved in her life. \'RUN.\' \'Why?\' \'Because I\'m CHASING you!\'':
          '腳踏車棚屋頂、圍牆、樹枝，在教室大樓和校門之間的每一個轉角攔截你——而你用走去公車站的速度走去公車站。不會逃的獵物就不是獵物。走到校門口時她只是走在你旁邊，一臉火大，用她這輩子最慢的速度。「快跑。」「為什麼？」「因為我在追你啊！」',
        'A hunt that turned into a walk home':
          '一場變成陪你走路回家的狩獵',
        'A thunderstorm caught Iori and {{user}} at the gym eaves and the girl who is afraid of nothing spent an hour holding his sleeve, denying it the whole time - \'I\'m not scared, I\'m just standing here, right next to you\' - then threatened to end him if he told anyone, and took his umbrella.':
          '一場雷雨把いおり和{{user}}困在體育館屋簷下，那個什麼都不怕的女生抓著他的袖子抓了一個小時，全程死不承認——「我才不怕，我只是站在這裡，就站在你旁邊」——然後威脅他敢說出去就完蛋，順手拿走了他的傘。',
        'Homeroom in the morning. She is in a classroom, which has never happened.':
          '早上的教室。她出現在教室裡，這種事從來沒發生過。',
        'One crack of thunder overhead and the girl who is afraid of nothing had two fistfuls of your sleeve and no idea how she got there. An hour of it, denying every second. \'That was nothing. I\'m not scared. I\'m just... standing here. Right next to you.\' Soaked through and not registering it as a problem, and staring at the blazer you put round her like a tool nobody taught her to use.':
          '頭頂上一聲雷，那個什麼都不怕的女生就兩手抓滿了你的袖子，而且不知道自己怎麼過來的。整整一個小時，每一秒都在否認。「那沒什麼。我才不怕。我只是……站在這裡。就站在你旁邊。」全身濕透卻完全不覺得那是個問題，而且盯著你披到她身上的外套，像在看一件沒人教過她怎麼用的工具。',
        'An hour of being held onto, and one stolen umbrella':
          '被抓著的一個小時，和一把被拿走的傘',
        'Iori turned up in homeroom - unheard of - sat on {{user}}\'s desk and dropped a warm bag of meat buns in front of him that she had run four kilometres to the station for, then ate half of them herself and pushed one into his mouth when he was slow.':
          'いおり出現在早上的教室裡——前所未聞——坐到{{user}}的桌上，把一袋還熱著的肉包放到他面前，那是她上學前跑了四公里去車站買的；然後她自己吃掉了一半，還在他動作太慢的時候把一個塞進他嘴裡。',
        'The shopping mall after school. Sui has named her price.':
          '放學後的購物中心。すい開出了她的條件。',
        'Iori Sekita in a classroom, before the bell, sitting on your desk. A warm bag of six dropped in front of you: \'Eat.\' She ate three of them and pushed one into your mouth when you were slow. She had run four kilometres to the station for them before school. It is beat one pointed the other way and neither person on the desk noticed.':
          '関田いおり出現在教室裡，在鐘響之前，坐在你的桌子上。一袋還熱著的六個肉包放到你面前：「吃。」她吃了三個，還在你動作太慢的時候把一個塞進你嘴裡。那是她上學前跑了四公里去車站買的。這是第一集反過來做一次，而桌上那兩個人誰也沒察覺。',
        'Six meat buns and four kilometres':
          '六個肉包和四公里',
        'Sui made Iori spend a supervised afternoon at the mall dressed as a lady, shaking in the fitting room the whole time; {{user}} arrived and looked at her exactly the way he looks at her on his desk, and when she demanded \'lady or animal, which one\', he said \'either way\' - so she kicked the shoes across the concourse and dragged him out barefoot.':
          'すい罰いおり在購物中心當一個下午的淑女、全程有人盯著，而她在試衣間裡從頭抖到尾；{{user}}到場之後看她的眼神，跟看她翹腳坐在自己桌上時一模一樣，於是當她逼問「淑女還是野獸，選一個」，他說「都可以」——她把鞋子踢過了整個中庭，光著腳把他拖了出去。',
        'One lunch break of being somebody else, to find the one that keeps you.':
          '一節午休的扮成別人，只為了找出哪一個能留住你。',
        'A pale dress, shoes she could not balance in, the flick on her head pinned flat, and a rule delivered kindly every few minutes all afternoon. Her hands shook in the fitting room and nobody looked. Then you arrived and your face did not change at all. \'SAY IT. Lady or animal. Which one.\' \'Either way.\' The shoes went across the concourse and she dragged you out barefoot.':
          '一件淡色洋裝、一雙她站不穩的鞋、頭頂那撮呆毛被夾平了，還有整個下午每隔幾分鐘就溫柔遞過來的一條規矩。她在試衣間裡手抖個不停，而沒有人在看。然後你到了，而你的表情完全沒有變。「說啊。淑女還是野獸。哪一個。」「都可以。」鞋子飛過了整個中庭，她光著腳把你拖了出去。',
        'Two words, and a pair of shoes nobody picked up':
          '兩個字，和一雙沒人去撿的鞋',
        'Over one lunch break Iori cycled through being other people at {{user}} - Shiko, then Yuki, then Haruka, then four minutes of silence, then the dress out of a sports bag she had packed that morning - because everyone gets tired and leaves and she wanted to know which version would keep him; he ate his lunch through all five and offered her the last meat bun.':
          '在一節午休裡，いおり一個接一個地在{{user}}面前扮成別人——先是四子，再來夕紀，然後遥香，接著沉默了四分鐘，最後從早上就打包好的運動提袋裡拿出那件洋裝換上——因為所有人都會膩、都會走，而她想知道哪一個版本留得住他；他從頭到尾把午餐吃完，然後問她要不要吃最後一個肉包。',
        'The corridor at lunch. She is walking you up to Sui on purpose.':
          '午休的走廊。她要拉著你走到すい面前。',
        'Shiko lasted four minutes. Yuki got the numbers wrong. Haruka won all nine and felt nothing. Silence lasted four minutes and eleven seconds. Then she came back from the bag in the dress, which nobody had asked her to do. \'Everyone gets tired. Tell me which one doesn\'t and I\'ll BE it.\' You offered her the last meat bun.':
          '四子撐了四分鐘。夕紀把數字全給錯了。遥香九場全贏，然後什麼感覺也沒有。沉默撐了四分十一秒。接著她從提袋那邊回來，身上是那件洋裝，而沒有任何人要求她這麼做。「所有人都會膩。告訴我哪一個不會，我就當那一個。」而你問她要不要吃最後一個肉包。',
        'Five auditions for a part nobody was casting':
          '五場沒有人在選角的試鏡',
        'Iori walked up to Sui on purpose and performed thirty flawless seconds of ladylike, shaking the whole time, then asked {{user}} if that was the one he wanted; he said \'whichever one\'s you, Iori\', and she worked out in the middle of the corridor that every version she had tried had felt exactly like the dress - then told Sui to her face, without bolting, \'this one\'s me\'.':
          'いおり主動走到すい面前，做了三十秒毫無破綻的淑女，全程在發抖，然後問{{user}}那是不是他要的那一個；他說「哪一個是你，就哪一個，いおり」，而她就站在走廊中間想通了：她試過的每一個版本，感覺都跟那件洋裝一模一樣——然後她當著すい的面說了出來，這一次沒有逃。',
        'The gate at home time. She is on top of it.':
          '放學時間的校門口。她站在門頂上。',
        'She walked up to the one person she has run from for three years, and performed it: the bow, the hands, the small steps, thirty flawless seconds, shaking the whole way through. \'Is this the one? I practised. Just SAY it.\' \'Whichever one\'s you, Iori.\' And standing in the corridor she worked out that the bro thing and the quiet thing and Shiko\'s thing had all felt exactly like the dress. Then she did not bolt.':
          '她主動走向那個她躲了三年的人，然後做了出來：鞠躬、疊好的手、小碎步，三十秒毫無破綻，而她從頭抖到尾。「是這一個嗎？我練過了。你說啊。」「哪一個是你，就哪一個，いおり。」然後她站在走廊上想通了：兄弟那個、安靜那個、四子那個，感覺全都跟那件洋裝一模一樣。然後她沒有逃。',
        'An opinion about herself, acquired in a corridor':
          '一個在走廊上撿到的、關於自己的答案',
        'Iori climbed the school gate at home time and shouted \'I LIKE HIM, THAT ONE, A LOT, EVERYBODY HEAR THAT\' at the entire school before she had ever said it to {{user}}; then she dropped down next to him as the thunder started and said she was not scared, she was just standing here, right next to you - and meant all of it this time.':
          'いおり在放學時間爬上校門頂，對著全校大喊「我喜歡他，就那一個，超喜歡，都聽到了沒」，而她還沒有對{{user}}本人說過；然後她在雷聲響起時跳下來站到他旁邊，說她才不怕，她只是站在這裡，就站在你旁邊——而這一次，整句都是真的。',
        'She said it to the whole school before she said it to you. (series complete)':
          '她先對全校說了，才對你說。（系列完結）',
        'From the top of the gate, to a courtyard full of girls going home: \'I LIKE HIM. THAT ONE. A LOT. EVERYBODY HEAR THAT? GOOD.\' She said it to the entire school before she said it to you, because it did not occur to her those were different events. Then the thunder started, and she did not move closer, because she was already there. \'You\'re mine now. Snooze, you lose.\'':
          '從校門頂上，對著滿中庭要回家的女生：「我喜歡他。就那一個。超喜歡。都聽到了沒？很好。」她先對全校說了才對你說，因為她根本沒想過那是兩件事。然後雷聲響了起來，而她沒有靠過來，因為她本來就在那裡了。「你現在是我的了。睡著就沒了。」',
        'Said out loud, from the top of a gate':
          '從一扇校門的頂上，大聲說出來',
        'On the Tab':
          '記在帳上',
        'The school\'s problem student was waiting at the gate to give you thirty seconds and a warning, and lost the thread of her own threat halfway through. She left without lighting the cigarette.':
          '全校最有名的問題學生在校門口等你，給你三十秒和一句警告，話說到一半自己斷了線。她走的時候，那根菸始終沒點。',
        'Shiko Okubo cornered {{user}} at the gate to give him thirty seconds and a warning, stepped back the moment she realised how close she had got, and lost the thread of her own threat because he kept his eyes on her face the whole time; she left without lighting the cigarette.':
          '大久保四子在校門口堵住{{user}}，給他三十秒和一句警告，發現自己靠得太近的瞬間退了一步，而且因為他從頭到尾只看著她的臉，她連自己的狠話都說斷了線；她離開時始終沒點那根菸。',
        'Behind the academy, after the bell. There are boys from another school hanging around the gate.':
          '放學後的校舍後面。校門口一直有外校的男生在晃。',
        'A finger in the chest at the gate post and thirty seconds to make it interesting - and then one step back, and the rest of the threat delivered at half the volume it started at, because he never once looked anywhere but her face. \'Okubo. Shiko. You\'ll hear it from someone anyway. Tell anyone about this and you\'re dead.\'':
          '校門柱旁一根指著胸口的手指，和三十秒「說點有趣的來聽聽」——然後是退開的一步，和剩下那半句只有一開始一半音量的狠話，因為他的視線從頭到尾沒離開過她的臉。「大久保。四子。反正你早晚會從別人嘴裡聽到。敢說出去你就死定了。」',
        'Thirty seconds, and a name':
          '三十秒，和一個名字',
        '{{user}} found Shiko behind the academy and asked her to teach him to throw a punch, and after a long pause she did - feet, hip, \'it\'s not your ARM, idiot\' - and at the end she would not take a thank-you and said \'you owe me, that\'s one\' instead.':
          '{{user}}在校舍後面找到四子，開口請她教他怎麼揮拳，而她沉默了很久之後真的教了——腳步、轉腰、「不是用你的手臂，笨蛋」——結束時她不肯接受道謝，只說了一句「你欠我的。這算一次」。',
        'The pool period. She has not been to one since the entrance ceremony.':
          '游泳課。入學典禮以來她一堂都沒去過。',
        'He asked the most avoided girl in the building to teach him to throw a punch, and the pause before she answered was the whole thing, because nobody has ever asked her for anything. Then she was very good at it, for eleven minutes, about the only subject she has ever been an authority on. \'You owe me. That\'s one.\'':
          '他去拜託全校最沒人敢靠近的女生教他揮拳，而她回答之前那段沉默才是重點，因為從來沒有人開口拜託過她任何事。然後她非常在行，整整十一分鐘，講的是她這輩子唯一稱得上權威的東西。「你欠我的。這算一次。」',
        'That\'s one':
          '這算一次',
        '{{user}} asked Shiko to come down and time his laps, and she attended her first pool period at this school - in her track jacket, zipped, over the costume - and called his splits exactly; the rumour went round that the delinquent was at the pool, and nobody got the reason, which is how she wanted it.':
          '{{user}}拜託四子下來幫他計圈速，於是她出席了在這所學校的第一堂游泳課——運動外套拉到領口，套在泳裝外面——而且把他的分段秒數報得分毫不差；「不良少女去了泳池」的傳聞傳遍了整個年級，沒有人知道原因，而那正是她要的。',
        'The shopping street at four. She says she is collecting.':
          '四點的商店街。她說她要來收帳。',
        'Every pool period since the entrance ceremony marked as truancy on a record where it was never truancy, and one favour - come down and time my laps - that got her to the poolside in a zipped track jacket with a stopwatch in her fist, calling his splits and naming the two places he lost time. The rumour reached the whole year by lunch. Nobody got the second half of it. \'Tell anyone WHY and you\'re dead.\'':
          '入學典禮以來每一堂游泳課都被記成翹課，而那從來都不是翹課；而一個「下來幫我計圈速」的請求，把她帶到了池邊——拉到領口的運動外套、握在手裡的碼錶、報出來的分段秒數，還有他慢掉的那兩個地方。傳聞在隔天午餐前傳遍了整個年級。沒有人知道後半段。「敢說出去為什麼，你就死定了。」',
        'A record that says the wrong thing on purpose':
          '一份故意寫錯的紀錄',
        'Shiko made {{user}} carry a week of groceries to a house with every window dark - \'parents work, shifts\' - then cooked, set one plate out of habit and came back to set a second, and at the door counted the cooking onto his tab as number three.':
          '四子叫{{user}}幫忙搬一個禮拜份的菜，搬到一棟每扇窗都黑著的房子——「爸媽在上班，輪班的」——然後她煮了飯，習慣性地只拿了一個盤子，又走回去拿了第二個，臨走時把煮飯記成他帳上的第三筆。',
        'The gate after four. The boys from across town have stopped just hanging around.':
          '四點的校門口。那幾個外校的男生不再只是站在那裡晃了。',
        'A week of cheap groceries for one person, carried to a narrow house at the end of her street with every window dark, and the hall light the first one on in the building. \'Parents work. Shifts.\' Then she cooked, and set one plate out of six years of habit, and came back and set a second. \'Carrying\'s not collecting. Cooking\'s a favour. That\'s three.\'':
          '一個禮拜份、便宜、一人份的菜，搬進她家那條街盡頭一棟每扇窗都黑著的窄房子，而玄關的燈是整棟樓第一盞亮起來的燈。「爸媽在上班，輪班的。」然後她下廚，習慣性地擺了一個盤子，又走回去擺了第二個。「搬東西不算收帳。煮飯是人情。這算第三筆。」',
        'A second plate':
          '第二個盤子',
        'Five boys from a school across town picked the gate and the class\'s worst four came to meet them; when their leader started on {{user}}, Shiko put herself in front of him and said \'he\'s MINE\' in front of everybody, then spent the rest of the afternoon insisting it was accounting.':
          '五個外校的男生挑上了校門口，而班上最難惹的四個人來了；當對方的頭頭把矛頭轉向{{user}}，四子擋在他前面，當著所有人的面說了「他是我的」，然後整個下午都在堅持那只是記帳。',
        'The station, after four. Somebody has to answer what she said at the gate.':
          '四點的車站。她在校門口說的那句話，總得有人回應。',
        'Five boys from across town at the gate, and the four girls who only ever stand together when somebody from outside starts on their class - and not one of the four treated being outsized as a relevant number. It did not come to blows. It came to Shiko stepping in front of him with her hands still in her pockets: \'Touch him and you deal with me. He\'s MINE.\' The whole gate heard it. \'He\'s on my TAB. That\'s ACCOUNTING.\'':
          '五個外校的男生堵在校門口，還有那四個只有在外人找上自己班級時才會站在一起的女生——而她們四個沒有一個把體型當成需要考慮的數字。事情沒有打起來。事情是四子雙手還插在口袋裡走到最前面：「敢碰他就是跟我過不去。他是我的。」整個校門口都聽見了。「他記在我帳上。這叫記帳。」',
        'One word, said in front of everybody':
          '當著所有人說出口的一個字',
        'Three of the boys waited at the station for {{user}} to send Shiko a message, and he went down once leading with his arm, got up and did it the way she taught him, put two of them on the floor and the third ran; Shiko ran the whole way there, froze at the edge of the concourse, then checked his lip with shaking hands and said \'that\'s twelve, you owe me twelve\'.':
          '三個外校的男生在車站等著{{user}}，好給四子一個回應；他第一次用手臂出拳被打倒在地，爬起來之後照著她教的打，把兩個人放倒，第三個跑了；四子一路跑到車站，在月台口整個人僵住，然後用發抖的手檢查他的嘴角，說了一句「這算第十二筆，你欠我十二筆」。',
        'The rooftop, a week on. She has been up there working out how to say something.':
          '一星期後的屋頂。她在上面想了很久要怎麼開口。',
        'Three of them waiting on the concourse, and not for her. He led with his arm the first time and took one in the face for it; the second time he did it the way she taught him behind the bins, and the third one ran. She ran the whole way from the bus and froze at the edge of the concourse, because nobody has ever stood in front of her. \'...That\'s twelve. And don\'t you EVER do that again.\'':
          '三個人在月台等著，而且等的不是她。他第一次用手臂出拳，結果臉上挨了一記；第二次他照著她在垃圾桶後面教的打，然後第三個人跑了。她從公車上一路跑過來，在月台口僵住，因為從來沒有人擋在她前面過。「……這算第十二筆。還有，你他媽再也不准這樣。」',
        'Twelve':
          '第十二筆',
        'Shiko tried to cut {{user}} loose on the rooftop - \'you\'re off the tab, we\'re square\' - because he had been hit on her account, and when he would not go it came out: sorted by adults at thirteen, a dark house since twelve, and nobody asking her for anything in six years. \'I\'ve asked you for eleven things.\' \'...Twelve.\'':
          '四子想在屋頂上把{{user}}切乾淨——「你從帳上下來了。我們兩清」——因為他是為了她才挨打的；而當他不肯走，話就全出來了：十三歲被大人先下了定論、十二歲起就黑著的家，還有六年來沒有人開口拜託過她任何事。「我拜託過你十一件事。」「……十二件。」',
        'Morning, before the bell. A uniform inspection has taken her jacket for the day.':
          '早上，鐘響之前。服裝檢查把她的外套收走了一天。',
        '\'You\'re off the tab. We\'re square. Don\'t come up here any more\' - because she said MINE at a gate and a week later he was on the floor of a station. He did not go. So it came out: thirteen and the adults deciding, twelve and a dark house, fourteen and nobody home to say no. \'Nobody\'s ever asked me for anything. Six years.\' \'I\'ve asked you for eleven things.\' \'...Twelve.\'':
          '「你從帳上下來了。我們兩清。以後別再上來。」——因為她在校門口說了「他是我的」，一個星期後他就躺在車站的地上。他沒有走。於是話全出來了：十三歲，還有那些先下了定論的大人；十二歲，還有一間黑著的房子；十四歲，而家裡沒有人會說不行。「六年來沒有人開口拜託過我任何事。」「我拜託過你十一件事。」「……十二件。」',
        'A ledger that was a wish list':
          '一本其實是願望清單的帳',
        'A uniform inspection took Shiko\'s jacket for the day and she sat in the blouse daring the room to comment; Iori commented, a chair went over, and then Sui told her she looked lovely and she bolted - and {{user}} found her behind the academy and asked her to walk him home because she is the scary one.':
          '服裝檢查把四子的外套收走了一天，她就穿著制服襯衫坐在位子上，等著看誰敢說話；いおり說了，一張椅子倒了，然後すい跟她說「你這樣很好看」，她當場奪門而出——而{{user}}在校舍後面找到她，拜託她送他回家，因為她才是那個嚇人的。',
        'Behind the academy, after four. She has asked him to come, which she never does.':
          '四點的校舍後面。她開口約他過去，而她從來不這麼做。',
        'The problem student in the actual uniform blouse, which has never fitted her, worn like armour anyway with her chin up and her arms folded, and a room full of girls suddenly interested in their own hands. Iori said the quiet part. A chair went over. Then Sui said \'you look lovely\' and the most feared girl in the year bolted out of the room.':
          '問題學生穿著那件從來就不合身的制服襯衫，卻依舊把它當盔甲穿：下巴抬著、手臂交叉，而整間教室的女生忽然都對自己的手很感興趣。いおり把大家沒說的話說了。一張椅子倒了。然後すい說了句「你這樣很好看」，這一屆最讓人害怕的女生奪門而出。',
        'Walk me home. You are the scary one.':
          '送我回家。你才是那個嚇人的。',
        'Shiko asked {{user}} to come behind the academy and put her lighter in his hand - \'hold this, don\'t give it back, even if I ask, especially if I ask\' - the first thing she has ever asked anyone for; he pocketed it and said nothing, and she said \'so now I owe YOU one\'.':
          '四子把{{user}}叫到校舍後面，把打火機放進他手裡——「拿著。別還我。就算我開口要也別還。尤其是我開口要的時候」——這是她這輩子第一次開口拜託人；他把打火機收進口袋，什麼也沒說，而她說了句「那現在換我欠你一次」。',
        'The gate, after four. Somebody is waiting at the post again.':
          '四點的校門口。有人又靠在那根柱子上等著。',
        'Six beats of a ledger she invented so she would never have to ask anybody for anything, and then the lighter, held out, in the same six square metres where she taught him to throw a punch. \'Hold this. Don\'t give it back. Even if I ask for it. Especially if I ask for it. This is me asking. Don\'t make me say it twice.\' He put it in his pocket and said nothing. \'...Right. So now I owe YOU one.\'':
          '六回合的帳，全是她為了永遠不必開口拜託任何人而發明出來的；然後是那個打火機，就遞在她教他揮拳的同一塊六平方公尺上。「拿著。別還我。就算我開口要也別還。尤其是我開口要的時候。這是我在拜託你。別逼我說第二次。」他把它收進口袋，什麼也沒說。「……好。那現在換我欠你一次。」',
        'The first thing she ever asked for':
          '她這輩子第一次開口要的東西',
        'Shiko waited at the same gate post and opened with the same thirty seconds as the day they met, then read out the whole tab from memory without ever having written a number down, said the price was that {{user}} keeps turning up and keeps asking her for things, and pulled him in by the jacket into a very badly executed hug.':
          '四子靠在同一根校門柱上等著，開場白和他們認識那天的三十秒一模一樣，然後她把整本帳一筆不漏地背了出來——她從來沒有寫下過任何一個數字——說代價就是{{user}}要一直出現、一直開口拜託她，然後揪著他的外套把他拽了過來，抱了一個拙劣到不行的抱。',
        'You keep turning up and you keep asking her for things. That is the tab. (series complete)':
          '你要一直出現，一直開口拜託她。那就是這筆帳。（系列完結）',
        'The same post, the same hour, the same opening line - and this time she is the one who cannot hold the eye contact, and she does not step back. Then the whole tab, read out from memory by somebody who never wrote a number down. \'So here\'s what it costs. You keep coming. Every time. You keep asking me for things. That\'s the tab. You don\'t get off it.\' Then a fist in his jacket, and a hug executed very badly by somebody who has never had one to copy.':
          '同一根柱子、同一個時間、同一句開場白——只是這一次移開視線的人是她，而且她沒有退開。然後是整本帳，由一個從來沒寫下過任何數字的人背了出來。「代價是這樣。你要一直來。每一次都要。你要一直開口拜託我。那就是這筆帳。你別想銷帳。」然後是揪著外套的一隻拳頭，和一個從來沒看過別人怎麼抱、所以抱得拙劣到不行的擁抱。',
        'You do not get off it':
          '你別想銷帳',
        'Open Book':
          '攤開的書',
        'The gentlest girl in the year was cleaning a room built for four on her own, and the only thing she remarked on afterwards was that you never asked her why.':
          '這一屆最溫柔的女孩，獨自打掃著一間四個人份的教室，而事後她唯一提到的一件事，是你沒有問她為什麼。',
        'Mei Hanamori was left to clean a classroom on her own by three girls who walked out, and did the whole room without complaining; {{user}} picked up the second bucket instead of lecturing her or fetching a teacher, and she said that everyone asks her why and he did not.':
          '花杜めい被三個逕自走掉的女生留下來獨自打掃整間教室，而她一句抱怨都沒有地把整間都掃完了；{{user}}沒有訓她，也沒有去找老師，而是拿起了第二個水桶——而她說，每個人都會問她為什麼，只有他沒問。',
        'The corridor at lunch. Somebody is going to ask her for money.':
          '午休時間的走廊。有人要來跟她借錢。',
        'A classroom meant for four with one very small person in it, and a second bucket picked up instead of a lecture. \'Um. You didn\'t ask me why.\' A pause, and then a smile that was aimed rather than vague. \'Everyone asks me why.\'':
          '一間四個人份的教室裡只有一個很小的人，還有一個不是拿來說教、而是直接被拿起來的第二個水桶。「嗯……你沒有問我為什麼。」一個停頓，然後是一個有對象、而不是茫然的笑。「每個人都會問我為什麼。」',
        'A name, and a question nobody asks':
          '一個名字，和一個沒人問的問題',
        'A girl borrowed Mei\'s lunch money with a story about a sick grandmother and Mei gave it to her without hesitating; {{user}} did not tell her to stop, he asked her what her own reason was, and she could not answer and found the question interesting rather than upsetting.':
          '一個女生用奶奶生病的故事跟めい借午餐錢，めい連猶豫都沒有就給了；{{user}}沒有叫她別給，而是問她自己的理由是什麼，而她答不出來，並且覺得這個問題很有意思，而不是難過。',
        'Lunch, with Kasumi at the table. Mei has a question and no idea that it is one.':
          '午餐時間，かすみ也在桌邊。めい有一個問題，而她完全不知道那算是個問題。',
        'A grandmother story the whole class knows by heart, and lunch money handed over before it had finished. Then the question nobody had ever put to her - not \'did you believe her\' but \'that\'s her reason, what\'s yours?\' \'...I don\'t know yet. Is it allowed, not knowing?\'':
          '一個全班都倒背如流的奶奶故事，而午餐錢在故事講完之前就遞出去了。然後是從來沒有人對她提過的那一句——不是「你相信她嗎」，而是「那是她的理由，你的理由呢？」「……我還不知道。不知道可以嗎？」',
        'The second question':
          '第二個問題',
        'Mei asked Kasumi at lunch, in front of {{user}}, how to make her chest bigger, and then asked {{user}} where it goes on a boy; he asked who had decided it was too small and told her to ask Kasumi whether she had wanted hers, and Kasumi said she would have liked to choose, and Mei quietly dropped the subject and held her hand.':
          'めい在午餐桌上當著{{user}}的面問かすみ怎麼樣才能讓胸部變大，然後轉頭問{{user}}男生的那些都跑到哪裡去了；他問是誰決定那太小的，又要她去問かすみ當初想不想要自己這副身材，而かすみ說她希望當初能自己選，於是めい安靜地放下了那個話題，牽起了她的手。',
        'The bus stop after five. She will tell you every single thing about her day.':
          '五點過後的公車站。她會把一整天裡的每一件事都講給你聽。',
        '\'Kasumi-chan. How do you make them bigger?\' - asked at a lunch table by an eighteen-year-old who has looked up the average and decided she falls short of it. The answer was not a joke and not a blush: who decided it was too small, and go and ask Kasumi whether she wanted hers. Kasumi said she would have liked to choose.':
          '「かすみ醬。怎麼樣才能變大？」——由一個查過平均值、並認定自己不及格的十八歲女生，在午餐桌上問了出來。回答既不是玩笑，也不是臉紅：是誰決定那太小的；還有，去問問かすみ當初想不想要。かすみ說，她希望當初能自己選。',
        'A want, weighed from the other side':
          '一個從另一邊秤過的「想要」',
        'Mei told {{user}} her whole day at the bus stop and said she hides nothing from friends; he told her a closed door is not a wall, and she then mentioned that the shoes, the frog and the letter were all Umi and that she has never told anybody, because \'there\'s nothing to tell, she was having a bad week\'.':
          'めい在公車站把一整天講給{{user}}聽，說她對朋友什麼都不藏；他告訴她關上的門不等於一堵牆，而她接著提到鞋子、青蛙和那封信全都是羽見做的，而她從來沒跟任何人說過，因為「沒什麼好說的，她那陣子心情不好」。',
        'The games lesson on the grounds. She is about to go over on her ankle.':
          '操場上的體育課。她就要扭到腳踝了。',
        'An entire day narrated at a bus stop, breakfast to maths lesson, on the principle that a friend ought to be able to read all of you. \'A door isn\'t a wall.\' And then, out of nowhere: the shoes, the frog and the letter were all Umi, and she has never told anybody, because \'there\'s nothing to tell - she was having a bad week\'.':
          '在公車站被完整敘述了一遍的一整天，從早餐講到數學課，理由是朋友應該要能讀懂你的全部。「關上的門不是一堵牆。」然後，毫無預兆地：鞋子、青蛙和那封信全都是羽見，而她從來沒告訴過任何人，因為「沒什麼好說的——她那陣子心情不好」。',
        'One page, closed on purpose':
          '一頁，刻意合上的',
        'Mei turned her ankle in the games lesson and the whole class tried to carry her; {{user}} asked whether she could put weight on it, then walked her to the infirmary at her own pace with her arm over his shoulder, and she asked to go the long way round so that nobody at the staff room windows would say things about him.':
          'めい在體育課扭到了腳踝，全班都搶著要把她抱走；{{user}}問的卻是她還踩不踩得住，然後讓她把手臂搭在他肩上，用她自己的步調走到保健室，而她要求繞遠路走另一側，免得教職員室窗戶那邊的人拿他說嘴。',
        'The old club room at the end of the science corridor. The door is unlocked, which it never is.':
          '理科走廊盡頭那間舊社辦。門是開的，而那扇門從來不開。',
        'Four girls telling her not to move and offering to carry her, and one person asking whether she could put weight on it. She walked to the infirmary on her own ankle at her own pace - by the long way round, past the side without the staff room windows on it, so that nobody would say things about him.':
          '四個女生叫她別動、搶著要抱她，而只有一個人問的是她還踩不踩得住。她靠自己的腳踝、用自己的步調走到了保健室——而且走的是遠路，繞過沒有教職員室窗戶的那一側，這樣就不會有人拿他說嘴。',
        'Her own ankle':
          '她自己的腳踝',
        'Umi rigged the disused club room to frighten Mei with a ghost voice and Mei sat down on the floor and asked it whether it was lonely, then told the wall that everyone is good underneath and that Umi is her friend; the voice stopped, and Mei left a pudding and a spoon on the floor for it and never said who she thought was in there.':
          '羽見在廢棄的舊社辦裝好了設備，要用鬼的聲音嚇めい，而めい在地板上坐了下來，問它在裡面孤不孤單，然後告訴那面牆，每個人骨子裡都是好的，而羽見是她的朋友；聲音停了，而めい在地上留下一個布丁和一支湯匙給它，始終沒說她以為裡面的是誰。',
        'The roof after the last bell. She has written something out four times and kept the fourth.':
          '放學後的屋頂。她寫了一樣東西，寫了四遍，留下了第四遍。',
        'A ghost in a wall with a speaker and a torch, and a girl who sat down on the floor and asked it whether it was lonely. \'Everyone\'s good underneath. Even when the outside is scary. Umi-chan\'s like that too. She\'s my friend.\' The voice stopped. She left a pudding against the wall, and a spoon with it.':
          '牆裡的一個鬼，配一支喇叭和一把手電筒；還有一個直接在地板上坐下來、開口問它孤不孤單的女生。「每個人骨子裡都是好的。就算外面很可怕也一樣。羽見醬也是這樣。她是我的朋友。」聲音停了。她在牆邊留下一個布丁，還有一支湯匙。',
        'A spoon, left for a ghost':
          '一支留給鬼的湯匙',
        'Mei confessed to {{user}} on the roof by copying a scene out of her girls\' romance manga word for word, and he read the letter seriously and asked whether the page was the book\'s or hers; she said she did not know yet, and he gave the letter back to her instead of answering and told her to say it when it was hers.':
          'めい在屋頂上向{{user}}告白，內容是把少女漫畫裡的場景一字不差抄下來的，而他認真地讀完了那封信，問她那一頁是書的還是她的；她說她還不知道，而他沒有回答，只是把信放回她手裡，要她等那句話真的是自己的時候再說。',
        'The classroom after the bell. Umi has run out of tricks.':
          '放學後的教室。羽見已經沒有招數可用了。',
        'A confession copied out of chapter twelve, drafted four times, the hour picked so that the light would match the panel - and then the one question that treats her as an adult: is this the book\'s page, or yours? \'...I don\'t know yet.\' The letter went back into her hands instead of being answered. \'Say it when it\'s yours. I\'ll still be here.\'':
          '一封照著第十二話抄下來的告白信，寫了四遍，連時間都挑過，好讓光線和那一格對得上——然後是唯一一個把她當成大人的問題：這一頁是書的，還是你的？「……我還不知道。」那封信沒有被回答，而是回到了她自己手裡。「等它是你的時候再說。我會在的。」',
        'A letter, returned to be rewritten':
          '一封退回去重寫的信',
        'Umi gave up teasing Mei and told her the true thing instead - that everybody is only nice to her because she is a child - and it was the first thing that ever landed; Mei thought about it and answered \'children don\'t decide, I decided\', and then went after Umi with a pudding because Umi had looked upset, while {{user}} watched from the window.':
          '羽見放棄了捉弄，改成把真話說出口——大家對你好，只是因為你是個小孩——而那是第一件真正打中她的事；めい想了很久，回答「小孩不會去決定。我決定了」，然後因為羽見看起來很難過，拿著布丁追了出去，而{{user}}在窗邊看著這一切。',
        'The cafe on the shopping street. She has started saying the second thing she thinks.':
          '商店街上的那間咖啡店。她開始會把心裡第二個念頭說出來了。',
        'Umi stopped joking and said the true thing instead - everybody is only kind to you because you are a child - and it was the first thing that had ever landed on her. Mei thought about it for a long time and said \'children don\'t decide. I decided.\' Then she went after Umi with a pudding, because Umi had looked upset.':
          '羽見不再開玩笑，改說了真話——大家對你好只是因為你是個小孩——而那是唯一一件真正打中過她的事。めい想了很久，然後說：「小孩不會去決定。我決定了。」接著她拿著布丁追了出去，因為羽見看起來很難過。',
        'Six words, and a pudding':
          '六個字，和一個布丁',
        '{{user}} said something with an accidental second meaning in the cafe and Mei caught it, went scarlet and admitted she had caught it, then said \'I usually don\'t say\' and left it there; she paid for both coffees with money she had folded in advance and told him at the door that she is learning.':
          '{{user}}在咖啡店說了一句不小心帶了第二層意思的話，而めい聽懂了，整個人紅透，還承認自己聽懂了，然後說了一句「我平常不會說」就停在那裡；她用事先摺好的錢付了兩杯咖啡，並在門口告訴他，她正在學。',
        'The school gate at the end of the day, with the light going gold. She has staged it on purpose.':
          '傍晚的校門口，光線正好。這一次的場面是她刻意擺出來的。',
        'An accidental second meaning, caught - by her, out loud, for the first time in this series. \'...I got that one.\' And then four words that quietly explain every beat before them and are never explained themselves: \'...I usually don\'t say.\' She paid for both coffees with money folded in advance.':
          '一句不小心帶了第二層意思的話，被聽懂了——而且是她自己說出口的，這在這個系列裡是第一次。「……那句我聽懂了。」然後是四個字，它們安靜地解釋了前面的每一拍，而它們自己從來沒有被解釋過：「我平常不會說。」兩杯咖啡的錢，是她事先摺好的。',
        'I usually don\'t say':
          '我平常不會說',
        'Mei staged the gate scene out of her manga and then threw the script away: she told {{user}} that kindness is something she picks and that she is going to stop being exactly as kind to him as to everyone else, asked him what HIS reason was, put a finger up and told him to say it when it was his, then took his hand and mentioned that she has always known he misses his bus for her and has never said so.':
          'めい把漫畫裡的校門場景整個佈置了出來，然後把劇本扔了：她告訴{{user}}，善良是她自己挑的，而她要停止對他和對別人一樣好，接著反問他「他」的理由是什麼，豎起一根手指要他等那句話是他自己的時候再說，然後牽起他的手，順口提到她一直都知道他為了她錯過公車，而且從來沒說過。',
        'She has a reason now, and she has asked you for yours. (series complete)':
          '她現在有理由了，而且她反過來問了你的理由。（系列完結）',
        'The gate, the light, the exact spot from chapter twelve - and then not one line of chapter twelve. \'Being kind isn\'t a rule. It\'s something I pick, and I\'m going to stop picking the same amount for you as for everybody else.\' Then his own lesson handed straight back: \'You\'ve been kind to me since April. What\'s your reason?\' A very small finger went up. \'Don\'t say it yet. Say it when it\'s yours.\'':
          '校門、光線、第十二話裡那個一模一樣的位置——然後一句第十二話的台詞都沒有。「善良不是規則。那是我自己挑的，而我要停止對你和對所有人一樣好。」接著是他自己教過的那一課，原封不動地還給他：「四月開始你就一直對我很好。你的理由是什麼？」一根很小的手指豎了起來。「先別說。等它是你的時候再說。」',
        'Say it when it is yours':
          '等它是你的時候再說',
        'So Easy':
          '太好懂了',
        'The loudest girl in the year ambushed you at the shoe lockers with a trick that only works on a boy, and the part she could not stop turning over afterwards was that you asked her for another one.':
          '這一屆最吵的那個女生在鞋櫃前堵住你，用了一個只對男生管用的把戲；而事後她真正忘不掉的，是你開口問了她下一個是什麼。',
        'Umi Hanyu ambushed {{user}} at the shoe lockers with a trick that only works on a boy - a pretext about something on his face, so she could pull her hoodie wide and bend over and put her chest in his eyeline - and it worked; then instead of denying it he agreed out loud that he had looked and named whose idea it was, which left a trick built out of denial with no second line, and he asked her what the next one was, which nobody has ever done.':
          '羽生羽見在鞋櫃前堵住{{user}}，用了一個只對男生管用的把戲——先拿「你臉上有東西」當藉口，好把連帽外套拉開、彎下腰，把胸口送到他的視線正前方——而且成功了；然後他沒有否認，反而當場承認自己看了，還指出那是誰安排的，讓一個從頭到尾建立在否認之上的把戲接不下去，接著他問她下一個把戲是什麼，而從來沒有人問過她這句話。',
        'Lunch. She is going to sit down opposite you and announce that she is here to ruin it.':
          '午餐時間。她會坐到你對面，並且宣告她是來毀掉你這頓飯的。',
        'A pretext about something on his face, a hoodie pulled wide before he came round the corner, and a bend from the waist held four seconds longer than any speck of dust needs. \'You LOOKED. Straight down my top. You\'re SO easy.\' Then: \'yes, you bent over and put them in front of my face\' - and a trick built end to end out of denial with nothing left to do. \'So what\'s next?\'':
          '一個「你臉上有東西」的藉口，一件在他轉過轉角之前就先拉開的連帽外套，還有一個比任何一粒灰塵所需要的時間多撐四秒的彎腰。「你「看」了。還一路看進我的衣服裡。你太好懂了——」然後是：「對，是你彎下腰、把它們擺到我臉前面的。」——一個完全靠否認運作的把戲當場沒戲。「那下一個是什麼？」',
        'A name, and a request for the next one':
          '一個名字，和一句「下一個是什麼」',
        'Umi sat down opposite {{user}} at lunch to ruin it and stayed the whole period, which she never does; there were two desserts on her tray, bought before she knew where he would be sitting, and she announced loudly that it was a bribe for a reaction, and he moved his tray over and never once said the word alone.':
          '羽見在午餐時間坐到{{user}}對面，說是要毀掉他這頓飯，結果整節午休都留著，而她從來不會這樣；她的餐盤上有兩份甜點，是在還不知道他會坐哪裡之前就買好的，而她大聲宣告那是用來收買反應的賄賂，而他把自己的餐盤挪開空出位置，從頭到尾一次都沒有說出「一個人」這三個字。',
        'The library at lunch. She is going to demonstrate her craft on somebody who reads faster than she does.':
          '午休時間的圖書館。她要在一個讀得比她快的人身上，表演她的手藝。',
        'The first time all term she has sat down at a table with anybody, announced at volume as an intention to ruin his lunch. Two desserts on the tray, bought before she knew where he would be. \'A bribe, obviously, I\'m buying a reaction off you.\' He moved his tray over and asked whether the material got better. \'Don\'t get ideas.\'':
          '整個學期以來，她第一次和人同桌坐下，還大聲宣告自己是來毀掉這頓飯的。餐盤上兩份甜點，在還不知道他會坐在哪裡之前就買好了。「賄賂啊，不然咧，我在跟你買一個反應。」他把餐盤挪開空出位置，然後問她段子會不會變得好笑一點。「別自作多情。」',
        'A second dessert, and nineteen minutes':
          '第二份甜點，和多留下來的十九分鐘',
        'Umi brought {{user}} to the library to watch her run a well-built trick on Suzu, and Suzu said both punchlines before she reached them and went back to her book; he did not laugh and did not comfort her, he told her the second line was doing two jobs and to fix it and bring it to him, which is her own line turned round.':
          '羽見把{{user}}帶到圖書館，要讓他看自己怎麼在鈴身上耍一個構思完整的把戲，結果鈴在她講到之前就先把兩個哏都抖完了，然後低頭繼續看書；他沒有笑她，也沒有安慰她，而是告訴她第二句台詞一句扛了兩件事，叫她修好了再拿來給他——那正是她自己的台詞，被反過來用在她身上。',
        'The bus stop in the rain. She has escalated, and she has nothing to calibrate against.':
          '雨中的公車站。她加碼了，而且沒有任何前例可以拿來校準。',
        'A genuinely well-built three-stage trick, dismantled on sight by somebody reading faster - both punchlines said first, flat, without looking up, plus a note about where the thread was visible from. And then, instead of a laugh or a rescue: \'the second line\'s doing two jobs. Fix it and bring it to me.\' Nobody has ever asked her for MORE tricks.':
          '一個真正構思完整的三段式把戲，被一個讀得比她快的人當場拆掉——兩個哏都被搶先講完，語氣平板、頭都沒抬，外加一句「線從窗戶那邊看得見」。然後，等著她的不是嘲笑，也不是安慰：「第二句有問題，一句扛了兩件事。修好拿來給我。」從來沒有人跟她要過「更多」把戲。',
        'Homework, from the person she came to frighten':
          '來自她本來想嚇的那個人的功課',
        'Umi stood in the rain for eleven minutes to ambush {{user}} at the bus stop in a soaked blouse, and he put his jacket round her and graded the trick six out of ten; then her bag gave way and a notebook fell open - every trick she has ever run, dated and scored in her own hand, the current page headed with his name - and he closed it unread and handed it back.':
          '羽見在雨裡站了十一分鐘，只為了穿著濕透的襯衫在公車站堵住{{user}}，而他把外套披到她肩上，還給了那個把戲十分之六的評分；接著她的包破了，一本筆記本攤開掉在地上——她這輩子做過的每一個把戲，有日期，有她自己手寫的分數——而當下那一頁的最上面寫著他的名字，而他一個字都沒看就把本子闔上還給了她。',
        'The grounds after the bell. She is going to try it on Iori to impress you, and lose.':
          '放學後的操場。她要在いおり身上試一次，為了讓你看，然後她會輸。',
        'Eleven minutes standing in the rain to set up a see-through-blouse bit, answered with a jacket round her shoulders and a verdict she did not ask for: six out of ten, the spider one was better, that one had a structure. Furious that he grades them, delighted that he remembers them. Then the notebook: every trick, dated, scored, and the current page with his name at the top of it.':
          '為了一個「襯衫是不是透了」的段子，在雨裡站了十一分鐘，換來的是一件披到肩上的外套，和一個她沒有要求的評語：十分之六，蜘蛛那個比較好，那個有結構，這個只是天氣。她氣他居然在評分，又高興得要命他居然記得。然後是那本筆記本：每一個把戲、每一個日期、每一個分數，而當下那一頁的最上面寫著他的名字。',
        'Six out of ten':
          '十分之六',
        'Umi showed off for {{user}} by rigging a trick for Iori and lost, because Iori never hears a setup and simply picked her up by the waist and shook her; two seconds before it went, Mei wandered under the drop and Umi hauled the wire clear and wrecked her own trick, which nobody saw except him, and she denied it flatly.':
          '羽見為了在{{user}}面前表演，把把戲架到いおり身上，然後輸了，因為いおり根本不聽鋪陳，直接一把把她從腰抱起來搖；而在機關啟動前兩秒，めい正好走到掉落點下方，羽見硬是把繩子扯開、毀掉了自己的把戲，除了他以外沒有任何人看見，而她矢口否認。',
        'The old club room at the end of the science corridor. The door is unlocked and the light is off.':
          '理科走廊盡頭那間舊社辦。門沒有鎖，燈也沒有開。',
        'The hardest mark in the year, picked to impress an audience of one, and lost in the most physical way available - no setup heard, no trick understood, just a girl lifted off the ground one-handed and shaken. And the thing nobody else saw: the wire hauled clear two seconds early because Mei had wandered under it. \'I did NOT.\'':
          '這一屆最難搞的目標，為了讓唯一一個觀眾刮目相看而挑上，然後用最物理的方式輸掉——鋪陳沒人聽、把戲沒人懂，只有一個女生被單手抱離地面、前後搖晃。還有那件沒有別人看見的事：機關啟動前兩秒，繩子被扯開了，因為めい剛好走到了下面。「我「才沒有」。」',
        'One rule, demonstrated once and denied':
          '唯一一條規矩，示範了一次，然後立刻否認',
        '{{user}} found Umi sitting on the floor of the dark club room where she had built the ghost, holding the pudding cup Mei had left for it and the spoon that came with it, having finally worked out that Mei knew who was in the wall and called her a friend anyway; she said it was dust, and he sat down against the same wall and never asked about the cup.':
          '{{user}}在那間漆黑的舊社辦地板上找到羽見——那個鬼是她做的——她手裡拿著めい留給鬼的布丁杯和附在旁邊的湯匙，剛剛才想通めい其實一直都知道牆裡的人是誰，卻依然說了「她是我的朋友」；她說那是灰塵，而他在同一面牆邊坐了下來，從頭到尾沒有問過那個杯子。',
        'The roof after the bell. She has spent a week building the best thing she has ever built.':
          '放學後的屋頂。她花了一整個星期，做出她這輩子最好的一個東西。',
        'The room where she was the ghost, and the pudding cup Mei left against the wall for it - with a spoon, because a ghost does not need a spoon, which is how she knows Mei knew all along and called her a friend anyway. \'It\'s dust. This room\'s disgusting.\' He sat down a metre away along the same wall and asked nothing.':
          '她當鬼的那個房間，還有めい靠著牆留給鬼的那個布丁杯——旁邊附了一支湯匙，而鬼是不需要湯匙的，所以她才知道めい從頭到尾都清楚，卻依然叫了她一聲朋友。「是灰塵。這房間髒死了。」他在一公尺外的同一面牆邊坐下，什麼都沒問。',
        'A spoon that gives the whole thing away':
          '一支把一切都說破了的湯匙',
        'Umi\'s masterpiece landed on {{user}} completely, three stages and a false ending, and winning was the worst feeling she has had, because a trick that lands is over and the mark walks away; he asked how she had built it instead, and she asked why he keeps coming back and he said because she does, and she sat down and told him how it worked for twenty minutes.':
          '羽見的代表作完完整整地打中了{{user}}，三段結構加一個假結局，而贏的感覺是她這學期最難受的一次，因為一個成功的把戲就等於結束、對方就可以走了；但他問的是她怎麼做出來的，而她反問他為什麼一直回來，他說因為妳也一直回來，於是她坐了下來，講了二十分鐘那個把戲是怎麼運作的。',
        'The classroom after the bell. She is rigging Mei\'s desk, and it is not a prank.':
          '放學後的教室。她正在めい的桌上架東西，而那不是惡作劇。',
        'Three stages, a false ending built because he is the only person who has ever looked for one, and no audience at all, which she has never done. It worked. And winning ended it, the way winning always ends it. \'That was a good one. How\'d you build it?\' \'...Why do you keep coming back?\' \'Because you keep coming back.\'':
          '三段結構，一個專門為了「他是唯一一個會去找假結局的人」而做的假結局，還有完全沒有觀眾——這是她這輩子第一次這樣做。它成功了。而成功就是結束，一如每一次的成功。「那個很好。你怎麼做出來的？」「……你為什麼一直回來？」「因為妳也一直回來。」',
        'The first conversation that was not about a trick':
          '第一場不是為了把戲的對話',
        'Umi rigged Mei\'s desk with an elaborate four-minute prank that was really a gift wrapped in one, because an apology is a sentence she cannot say; Mei went through all four stages laughing and thanked her for a really good one with no subtext at all, and {{user}} told her Mei had never needed the apology, which took her apart.':
          '羽見在めい的桌上架了一個要花四分鐘才能破解的精緻惡作劇，而那其實是一份包在惡作劇裡的禮物，因為道歉是一句她說不出口的話；めい笑著走完了全部四個階段，然後完全沒有任何弦外之音地謝謝她「這個真的很棒」，而{{user}}告訴她めい從來就不需要那句道歉，這句話把她拆散了。',
        'Morning, before the bell, in front of the whole class. She is going to prove she has still got it.':
          '早上，鐘響之前，在全班面前。她要證明自己還有這個本事。',
        'An apology built as a prank, because she has no other grammar for one - four minutes of affectionate jokes at Mei\'s expense with a thing Mei has wanted at the end of them. \'Thank you, Umi-chan. That was a really good one.\' No subtext, none, because Mei was never reading for one. \'She didn\'t get it.\' \'She didn\'t need it.\'':
          '一份用惡作劇包起來的道歉，因為她沒有別的文法可以用——四分鐘的、全都拿めい開玩笑的、而每一個玩笑都帶著感情的機關，最後藏著一樣めい一直想要的東西。「謝謝你，羽見醬。這個真的很棒。」沒有弦外之音，一點都沒有，因為めい根本不是為了找弦外之音在讀。「她沒聽懂。」「她不需要聽懂。」',
        'A debt the other person never opened':
          '一筆對方從來沒開過帳的債',
        'Umi ran a trick on {{user}} in front of the whole class - a false hoodie drawstring tied to a spare bra hidden in her neckline, so that one pull would look to the room like he had undressed her - and the extra tape she added because she was nervous made it jam, so the whole paper-wrapped bundle came out in one piece and the room began laughing at her; he took a beat, understood exactly what it was, and then sold the panic the trick had been built for, and the laughing turned onto him instead, and Sui saw him do it and said nothing.':
          '羽見在全班面前對{{user}}用了一個把戲——一條假的連帽外套抽繩，繫在藏於她領口內的一件備用內衣上，好讓他一拉，在全班眼裡就像是他把她的衣服扯掉了——而她因為緊張多貼的膠帶讓它卡住，整個用紙包著的東西一整塊被拉了出來，於是全班開始笑她；他停了一拍，完全看懂了那是什麼，然後把那個把戲本來要的慌亂演了出來，於是笑聲轉到了他身上，而すい看見了他做的事，什麼也沒說。',
        'The shoe lockers at the end of the day. She is standing exactly where she stood the first afternoon.':
          '放學時分的鞋櫃。她站的位置，和第一天下午一模一樣。',
        'A false drawstring tied to a spare bra hidden in her neckline, built so that one pull would make the one boy in the school believe he had undressed her in front of thirty people - and it jammed, because she was nervous and taped it too well, so the bundle came out still wrapped. \'Did that even DO anything?\' Then a chair going back hard and \'SORRY - I THOUGHT THAT WAS YOUR HOODIE STRING\', a beat too late to be a reflex. \'You didn\'t have to do that.\' \'I know.\'':
          '一條假抽繩，繫在她領口內藏著的備用內衣上，設計成一拉就會讓全校唯一的男生以為自己在三十個人面前把她的衣服扯掉了——然後它卡住了，因為她太緊張、膠帶貼得太牢，整包東西連紙一起被拉了出來。「那個到底「有」做到什麼嗎？」接著是椅子重重往後刮的聲音，和一句「對不起——！我以為那是你外套的繩子！」，慢了一拍，慢到不可能是反射動作。「你不需要那樣做。」「我知道。」',
        'Somebody took the fall on purpose':
          '有人故意接下了那一摔',
        'Umi ran the shoe-locker trick from the first afternoon again word for word, and when {{user}} said yes he looked she went scarlet and told him it is okay to look at her body, just not other girls\'; then she said that two people stay after the trick and one of them brings pudding, and he handed her own question back as \'so what\'s next, Ms Little Devil\', and she went scarlet again.':
          '羽見把第一天下午的鞋櫃把戲一字不差地重演了一次，而當{{user}}說「對，我看了」，她整張臉紅透，告訴他可以看她的身體、就是不准看別的女生的；然後她說，把戲結束之後會留下來的只有兩個人，而其中一個會帶布丁，接著他把她自己的問題還給了她——「那，下一個是什麼，小惡魔小姐？」——她又紅了一次。',
        'Two people stayed after the trick. You are one of them. (series complete)':
          '把戲結束之後，有兩個人留了下來。你是其中一個。（系列完結）',
        'The same locker, the same hour, the same pretext word for word - and no \'so easy\' at the end of it. \'...It\'s fine. You can look. It\'s okay to look at my body. Just... not other girls\'!\' Then, to the locker door: \'two people stay after the trick. One of them brings pudding.\' And then her own first-afternoon question, handed back: \'so what\'s next, Ms Little Devil?\'':
          '同一個鞋櫃、同一個時間、同一句一字不差的藉口——而結尾沒有「太好懂了」。「……沒關係啦。你可以看。看我的身體沒關係。就是……不准看別的女生的！」然後，對著櫃門說：「把戲結束以後會留下來的，只有兩個人。其中一個會帶布丁。」接著是她自己第一天下午的那個問題，被還了回來：「那，下一個是什麼，小惡魔小姐？」',
        'Ms Little Devil':
          '小惡魔小姐',
        'Either Is Fine':
          '都可以',
        'The quietest girl in the year could not decide whether to hand you a sheet of paper or put it on your desk, and the only thing she said afterwards was that nobody waits.':
          '這一屆最安靜的女孩，沒辦法決定要把講義遞給你、還是放在你桌上；而她事後唯一說出口的一句話，是從來沒有人等過她。',
        'Kasumi Okudera was on handout duty after the bell, carrying the stack against her chest the way she carries everything, and could not decide whether to hand {{user}} his sheet or leave it on the desk; he did not reach for it and did not tell her to take her time, he waited, and she said thank you for waiting and that nobody waits.':
          '奧寺かすみ放學後負責發講義，像她拿任何東西一樣把那疊紙抱在胸前，然後沒辦法決定要把{{user}}那一張遞給他、還是放在桌上；他沒有伸手去拿，也沒有叫她「慢慢來」，他就是等著——而她說了謝謝你願意等，還說從來沒有人等過她。',
        'The bakery on the shopping street. Two breads, nobody waiting, and no wrong answer anywhere.':
          '商店街上的麵包店。兩個麵包，沒有人在等，而且哪裡都不存在錯的答案。',
        'Forty handouts carried against her chest the way she carries everything, and a fork with two branches - hand it over, or put it on the desk - that took four started sentences and a very long silence. He did not reach for it, and he did not say \'take your time\'. \'Th-thank you. For waiting. ...N-nobody waits.\'':
          '四十張講義，像她拿任何東西一樣抱在胸前；還有一個只有兩條岔路的選擇——遞過去，還是放在桌上——花掉了四個開了頭的句子和一段很長的沉默。他沒有伸手去拿，也沒有說「慢慢來」。「謝、謝謝你。願意等我。……從、從來沒有人等過我。」',
        'Somebody who picked neither':
          '一個兩邊都沒有替她選的人',
        '{{user}} bought a melon bread and a honey bread, walked Kasumi to the bench at the side of the shopping street with nobody waiting and nothing to lose, and asked her to pick; it took four minutes, and he gave no opinion at any point, before or after, and ate the honey one.':
          '{{user}}買了一個菠蘿麵包和一個蜂蜜麵包，把かすみ帶到商店街旁的長椅上——沒有人在等，也沒有任何東西可以失去——然後請她挑一個；她花了四分鐘，而他從頭到尾、事前事後都沒有給任何意見，然後吃掉了蜂蜜那個。',
        'The courtyard at lunch. Mei wants to be taught a posture that is really a hunch.':
          '午休的中庭。めい想學一種「姿勢」，而那其實是一個彎背。',
        'Two breads already paid for, a bench with nobody behind her, no queue and no clock - every variable he could think of removed, to find out whether pressure was the cause. It took four minutes. He gave no opinion before or after and ate the honey one. Pressure was not the cause.':
          '兩個已經付過錢的麵包，一張背後沒有人在等的長椅，沒有隊伍也沒有時間壓力——他能想到的變因全部移除，就為了確認「壓力」是不是原因。結果花了四分鐘。他事前事後都沒給意見，然後吃了蜂蜜那個。壓力不是原因。',
        'Four minutes, and a theory disproved':
          '四分鐘，和一個被推翻的假設',
        'Mei asked Kasumi to teach her \'the posture\' in the courtyard in front of {{user}}, not knowing the posture is a hunch built to hide; Kasumi could not decide whether to tell her, and when he asked which one was the real posture she stood up straight to show Mei, in one second, for one second, and folded again scarlet.':
          'めい在中庭當著{{user}}的面拜託かすみ教她「那個姿勢」，而她不知道那個姿勢其實是一個用來遮掩的彎背；かすみ沒辦法決定要不要告訴她，而當他問哪一個才是真正的姿勢時，她挺直了身體示範給めい看——花了一秒，維持了一秒，然後整張臉通紅地又縮了回去。',
        'The haberdashery counter in the mall. Two blues, and a question he has been saving.':
          '購物中心裡的手工藝材料櫃檯。兩種藍色，和一個他一直留著沒問的問題。',
        'Mei asked to be taught The Posture, not knowing it is a hunch built over six years to hide the very thing Mei wants to grow. Kasumi could not decide whether to tell her - and when asked which one was the real posture, stood up straight in a courtyard at lunch, in one second, for one second, for Mei.':
          'めい開口要學「那個姿勢」，卻不知道那是一個花了六年、專門用來遮掩她想長出來的那樣東西的彎背。かすみ沒辦法決定要不要說——而當有人問她哪一個才是真的，她在午休的中庭挺直了身體，花了一秒，維持了一秒，為了めい。',
        'One second, when it was for somebody else':
          '一秒鐘，當那是為了別人的時候',
        'Kasumi spent nineteen minutes at the haberdashery counter unable to choose between two blues for the fourth re-sew of her blouse, and when {{user}} asked which she would pick if the blouse were for somebody else she answered in one second; he bought that blue and said nothing about it.':
          'かすみ在手工藝材料櫃檯前站了十九分鐘，沒辦法在兩種藍色之間選出替襯衫第四次改製要用的那一種；而當{{user}}問她「如果這件襯衫是別人的，你選哪一個」，她一秒就答出來了；他買了那一種，什麼都沒有說。',
        'Morning, before the bell. The seat lottery, and six girls who already know what she wants.':
          '早上，鐘響之前。抽座位，還有六個早就知道她想要什麼的女生。',
        'Nineteen minutes between two blues for the fourth re-sew of a blouse she keeps altering to hide more and fit worse. \'If the blouse were for somebody else. Which?\' \'That one.\' One second, finger on the reel before the sentence had finished. He bought that blue and said nothing about it at all.':
          '十九分鐘，在兩種藍色之間，為了一件她一直改、改到更能遮、也更不合身的襯衫做第四次改製。「如果這件襯衫是別人的。你選哪一個？」「那一個。」一秒，話還沒說完手指就已經按在線軸上了。他買了那一種，然後對這件事一個字都沒提。',
        'A theory confirmed, and never mentioned':
          '一個被證實、卻從未被說破的假設',
        'Kasumi drew the front row, window side, in the seat lottery and six girls offered to swap before she had stood up, none of them asking whether she wanted to; {{user}} was the only person in the room who did not offer, she noticed, and she kept the seat.':
          'かすみ在抽座位時抽到了靠窗的第一排，而在她站起來之前就有六個女生提議跟她換，沒有一個人問過她想不想換；{{user}}是全班唯一沒有開口提議的人，她注意到了，然後她留下了那個位子。',
        'The courtyard at lunch. The other two of the big three have decided to help, kindly, in public.':
          '午休的中庭。班上「三巨頭」的另外兩位決定要幫忙了，出於好意，而且是在公開場合。',
        'The front row, window side - the most visible desk in the room - and six girls offering to swap before she had stood up, not one of them asking whether she wanted to. He was the only person in the room who did not offer. She noticed. \'...I-I\'ll keep it.\' The first stack of handouts landed on her before the morning was out.':
          '靠窗的第一排——教室裡最顯眼的座位——而在她站起來之前就有六個女生提議跟她換，沒有一個人問過她想不想換。他是全班唯一沒有開口的人。她注意到了。「我、我留著。」第一疊講義在那個早上還沒過完之前，就落到了她身上。',
        'The front row, because one person declined to choose':
          '第一排，因為有一個人拒絕替她決定',
        'Ume and Mana flanked Kasumi on a courtyard bench to pass on everything they know about carrying an H cup, kindly and in public, until {{user}} asked her whether she wanted their help or not; she said yes, but not here, and for once the decision was asked for, made, and stood.':
          'うめ和真奈在中庭的長椅上一左一右夾著かすみ，出於好意、而且當著大家的面，把她們所有關於怎麼扛住 H 罩杯的心得全部傳授給她，直到{{user}}開口問她到底想不想要她們幫忙；她說想，但不要在這裡——而這一次，那個決定是被詢問的、被做出的，而且成立了。',
        'The infirmary at lunch. Her back has been carrying six years of hiding.':
          '午休的保健室。她的背扛了六年的「遮掩」。',
        'Ume and Mana flanking her on a bench with bra brands and the top-button trick, being kind, in public, while she folded into the cardigan until only the ahoge showed. \'Do you want their help, or not?\' Nobody had ever asked. \'...Y-yes. But not here.\' And it stood.':
          'うめ和真奈在長椅上一左一右夾著她，講內衣品牌、講第一顆扣子的訣竅，出於好意，而且在大庭廣眾之下，而她把自己縮進開襟衫裡，縮到只剩一根呆毛露在外面。「你想不想要她們幫忙？」從來沒有人問過。「我、我想。但是……不要在這裡。」然後那個決定成立了。',
        'A decision that was asked for, and stood':
          '一個被問過、而且成立了的決定',
        'Kasumi\'s back gave out and the nurse said the hunch was the injury, not the weight; in the corridor {{user}} told her to her face that it looks good straight or hunched, that everyone has been seeing the same thing since April, and that there was no version where she decides wrong, and she went scarlet and stood up straight for the first time since she was twelve, and nobody looked any differently.':
          'かすみ的背撐不住了，而保健老師說傷害來自那個彎背，不是那個重量；在走廊上{{user}}當著她的面告訴她，挺直也好、彎著也好，看起來都很好看，大家從四月開始看到的都是同一件事，而且這件事「不存在她選錯的那個版本」——她整張臉通紅，然後挺直了身體，那是她十二歲以來的第一次，而沒有任何人的眼神有任何不同。',
        'The classroom after the bell. A blank wall, thirty people, and a hundred forks.':
          '放學後的教室。一面空白的牆、三十個人，和一百個岔路。',
        'The nurse said the hunch was the injury, not the weight. Then, in the corridor: \'you know it looks good, right? Straight or hunched, it\'s the same thing they\'ve seen since April. There\'s no version of this where you decide wrong.\' She heard the half about her body immediately. She stood up straight anyway, and nobody looked any differently.':
          '保健老師說了那句話：傷害是那個彎背，不是那個重量。然後，在走廊上：「你知道那樣很好看吧？挺直也好、彎著也好，都是他們從四月就一直在看的同一件事。這件事沒有你選錯的版本。」關於身體的那半句，她立刻就聽見了。她還是挺直了身體，而沒有任何人的眼神有任何不同。',
        'Six years of hunching, put down in a corridor':
          '六年的彎背，在一條走廊上被放了下來',
        'Handed the back-wall display for the whole class, Kasumi sat frozen for an hour; {{user}} did not help her choose, he asked who the wall was for, reminded her she had picked the thread in one second when it was for somebody else, and she laid the whole wall out in ninety seconds, and he said \'do you realise your hesitation just disappeared - I wonder why\' and left.':
          '被交付了全班的後牆佈置之後，かすみ在空白的牆前面呆坐了一個小時；{{user}}沒有幫她選，他問這面牆是給誰的，提醒她當那條線是別人的時候她一秒就選好了，然後她用九十秒把整面牆排完了——而他說了一句「你有發現你剛剛完全沒有猶豫嗎？……真奇怪呢」，然後就走了。',
        'The class photograph on the grounds. Shortest at the front, centre.':
          '操場上的班級合照。最矮的站第一排，正中間。',
        'An hour frozen in front of a blank wall, with three crossed-out sketches on the desk. He did not help her choose. \'Who\'s the wall for?\' \'You picked the thread in one second when it was for somebody else.\' Ninety seconds later the wall was laid out - and he said \'do you realise your hesitation just disappeared? I wonder why\' and left.':
          '在一面空白的牆前面呆坐了一個小時，桌上三張都被劃掉的草稿。他沒有幫她選。「這面牆是給誰的？」「那條線是別人的時候，你一秒就選好了。」九十秒之後整面牆排完了——然後他說「你有發現你剛剛完全沒有猶豫嗎？真奇怪呢」，然後就走了。',
        'A question he did not answer':
          '一個他沒有回答的問題',
        'Placed front and centre for the class photograph, Kasumi stood there straight without asking to swap and only noticed afterwards that she had not even thought about it; then she found {{user}} and worked it out aloud - he never once told her to hurry, and every choice she made he did, even when she thought it was wrong - and he neither confirmed nor denied it.':
          '班級合照時かすみ被排在第一排正中間，而她就那樣挺直站著，沒有開口要求換位子，事後才發現自己「根本連想都沒想」；然後她去找了{{user}}，自己把原因拼了出來——他從來沒有催過她一次，而她做的每一個決定，他都照做了，就算她自己覺得那是錯的——而他既沒有承認，也沒有否認。',
        'The bench outside the bakery. She has been in, and she has bought both.':
          '麵包店外面的那張長椅。她進去過了，而且兩個都買了。',
        'Front and centre in the class photograph, standing straight with no cardigan, and no sighing photographer, because there was nothing to sort out. \'...I didn\'t even think.\' Then, in pieces and with restarts: he never once told her to hurry, and every choice she made, he did. \'I thought you were being patient. It wasn\'t patience, was it.\'':
          '班級合照的第一排正中間，挺直站著，沒有開襟衫，而攝影師沒有嘆氣，因為根本沒有什麼需要喬。「我……我根本連想都沒想。」然後，斷斷續續、重來又重來地：他從來沒有催過她一次，而她做的每一個決定，他都照做了。「我以為你只是很有耐心。那不是耐心，對不對。」',
        'The cause, worked out on her own':
          '她自己想出來的那個原因',
        'Kasumi bought a melon bread and a honey bread herself, sat {{user}} down on the same bench as before and told him it was his turn to choose; when he teased that she had found a way to make him decide for her, she smiled and said she had already made her choice - she had decided he was the one who gets to choose for her.':
          'かすみ自己買了一個菠蘿麵包和一個蜂蜜麵包，把{{user}}帶到和上次同一張長椅上坐下，告訴他這次換他選；而當他打趣說她是不是還是沒辦法決定、所以找到辦法讓他來替她決定，她笑著說她早就選好了——她決定了，他就是那個可以替她做決定的人。',
        'She decided who gets to decide. (series complete)':
          '她決定了由誰來決定。（系列完結）',
        'The same bench, the same two breads, bought with her own money and carried at her hip rather than against her chest. \'...Y-your turn. To choose. I\'ll take the other one.\' \'So you still can\'t decide, and now you\'ve found a way to make me do it for you?\' \'I\'ve already made my choice. I decided you\'re the one who gets to choose for me.\'':
          '同一張長椅、同樣兩個麵包，用她自己的錢買的，而且是提在腰邊、不是抱在胸前。「換、換你了。你選。剩下那個我吃。」「所以你還是沒辦法決定，現在找到辦法讓我來替你決定了？」「我早就選好了。我決定了，你就是那個替我選的人。」',
        'She picked the person':
          '她選的是那個人',
        'Mama\'s Not Hungry':
          '「Mama 不餓」',
        'The class mother filed you with her children on the first afternoon, and every routine she owns was built for girls and has never once been aimed at anybody else.':
          '班上的媽媽在第一個下午就把你歸進了她的孩子裡，而她所有的照顧習慣都是為女孩子建立的，從來沒有對別人用過。',
        'Sui Mizushiro was running a queue at the shoe lockers after the bell, handing out lunches and handkerchiefs and instructions, and she stopped {{user}} to fix his collar and put a bento in his hands that had been made for somebody she had not met; she called him a good boy in exactly the voice she uses on the girls, and when a classmate thanked her for something she said that Mama doesn\'t need anything.':
          '水城すい放學後在鞋櫃那邊排出了一條隊伍，發便當、發手帕、發指示；她攏下{{user}}替他整理衣領，還把一份為她根本沒見過的人做的便當塞進他手裡；她用對女孩子說話時一模一樣的聲音叫他「好孩子」，而當有同學向她道謝時，她說 Mama 不需要任何東西。',
        'The shopping street after school. She is buying for four people and none of them is her.':
          '放學後的商店街。她在替四個人買東西，而那四個人裡沒有她自己。',
        'A queue at the shoe lockers that was not for the lockers. Lunches, handkerchiefs, instructions, a collar fixed with both hands, and a bento out of a box that had already emptied four times. \'You\'ll eat every last bite. ...There\'s a good boy.\' Nobody in that queue asked her a single question.':
          '鞋櫃前排著一條不是為了鞋櫃的隊伍。便當、手帕、指示，一雙手替人整理好的衣領，還有一份從已經空了四次的盒子裡拿出來的便當。「你要全部吃完喔。……這才乖。」那條隊伍裡，沒有任何一個人問過她一句話。',
        'One of hers, filed on the first afternoon':
          '第一個下午就被歸進她的孩子裡',
        'Sui wiped {{user}}\'s mouth with her thumb in the middle of the shopping street and called him a good boy, and he said \'yes, Mama\' back at her in a grown man\'s voice loudly enough for the street to hear, and she went red to the hairline and could not hide a second of it; she decided he was being cheeky, because cheek is a thing children do, and when he asked what she had bought for herself she said Mama doesn\'t need anything.':
          '在商店街正中央，すい舔了拇指替{{user}}擦掉嘴角的東西，叫了他一聲好孩子，而他用一個成年男人的聲音、用整條街都聽得見的音量回了一句「是的，Mama」——她從衣領一路紅到髮際，一秒都藏不住；她後來認定他只是在調皮，因為調皮是小孩子才會做的事，而當他問她替自己買了什麼，她說 Mama 不需要任何東西。',
        'Lunch, and twenty minutes. She has offered her lap the way she offers it to the girls.':
          '午休，還有二十分鐘。她像對女孩子那樣，把自己的膥蓋讓了出來。',
        '\'Yes, Mama,\' at full volume, in a grown man\'s voice, in the middle of the shopping street - and she went red to the hairline and could not hide one second of it, and had no idea why it landed. She decided he was being cheeky. Two bags of shopping, and not one thing in either of them was hers.':
          '「是的，Mama」——全音量，成年男人的聲音，在商店街正中央——她紅到髮際，一秒都藏不住，而且完全不明白那句話為什麼會有這種效果。她的結論是他在調皮。兩袋東西，裡面沒有一樣是她的。',
        'A word of her own, handed back in the wrong voice':
          '她自己的那個詞，用錯誤的聲音還了回來',
        'Sui offered {{user}} her lap for a twenty-minute nap the way she has offered it to a dozen girls, and then could not take the offer back, so she sat through the whole of it with her back straight and both hands held in the air and the colour climbing while the class filed past; she woke him exactly on time as promised, stood up on legs that had gone dead, and said Mama\'s legs are fine.':
          'すい像把膥蓋讓給那些女孩子一樣，把二十分鐘的午睡位子讓給了{{user}}，然後就再也收不回那個提議了，於是她挺著背、兩手懸在半空中撐完了整整二十分鐘，臉上的顏色隨著同學一個個走過而越爬越高；她說到做到，準時把他叫醒，然後用一雙已經完全麻掉的腿站了起來，還說 Mama 的腿沒事。',
        'The club room after the bell. A hole in the one pair of trousers in the building.':
          '放學後的社團教室。全校唯一那條長褲上的一個洞。',
        'Her lap, offered the way she offers it to the girls, and then an offer she could not take back. Twenty minutes with her back straight and both hands in the air while the class filed past. She woke him exactly on time, stood up on legs that had gone dead, and said Mama\'s legs are fine.':
          '她像對女孩子那樣讓出膥蓋，然後那個提議就再也收不回來了。二十分鐘，背挺得筆直，兩隻手懸在半空，而全班端著餐盤一個個走過。她準時把他叫醒，用一雙麻掉的腿站起來，然後說 Mama 的腿沒事。',
        'Twenty minutes, and two hands with nowhere to go':
          '二十分鐘，和兩隻無處可放的手',
        '{{user}} tore his trousers open at the inner thigh on a desk hook and the spare-uniform cupboard held nothing but girls\' clothing, so Sui sincerely offered him a skirt and then knelt on the club-room floor and mended it while he stood in it; she was entirely Mama for the first minute and then realised where she was kneeling and went scarlet to the ears and finished the job anyway, because a kindness begun is finished.':
          '{{user}}被桌子底下的掛鉤把長褲大腿內側扯開了一個洞，而備用制服櫃裡除了女生的衣服什麼也沒有，所以すい非常認真地提議給他一件裙子，接著在社團教室的地板上跪下來，就著他穿在身上的狀態把它縫好；她前一分鐘完全是 Mama，然後才意識到自己跪在什麼位置，整張臉紅到耳根，卻還是把那件事做完了——因為開了頭的好意就沒有半途放下的道理。',
        'The prep room, after the exchange day. Everything in that building goes through one person.':
          '交流日之後的整備室。那整棟樓的所有事情，都經過同一個人。',
        'A hole through the inner thigh, a cupboard containing nothing but girls\' uniforms, and a skirt sincerely offered. Then the floor, and \'stand still, please\' and \'Mama needs the cloth flat\', in full serene Mama register, until she leaned back to bite the thread and saw where her own face had been. She finished the job anyway.':
          '大腿內側一個破洞、一個除了女生制服什麼都沒有的櫃子，還有一件被非常認真地遞出來的裙子。然後是地板，是「請不要動」和「Mama 需要把布攞平」，用最從容的 Mama 語氣說出來——直到她往後仰咬斷線，看見自己的臉剛剛一直在什麼位置為止。她還是把那件事做完了。',
        'A job finished from the floor':
          '一件跪在地板上做完的工作',
        'Sui ran the whole teardown of the exchange day out of one prep room without once looking at a note, and the three cold rice balls on the desk turned out to be for a club that had left an hour before; {{user}} made her stop and asked what SHE had eaten, and she answered fluently three times about other people, and when he told her to take the word Mama out of the sentence she got as far as \'I\' and could not find the verb, so he tore a bun in half and put the bigger half in her hand.':
          'すい一眼筆記都沒看，就把整個交流日的收尾全部從一間整備室裡調度完畢，而桌上那三個冷掉的飯糰，原來是留給一個一小時前就離開的社團的；{{user}}讓她停下來，問她自己吃了什麼，而她流利地答了三次，三次都是在講別人；當他要她把「Mama」這個詞從句子裡拿掉時，她只說出了一個「我」字，找不到後面該接的動詞，於是他把一個麵包撕成兩半，把比較大的那一半放進她手心。',
        'The mall, one hour, and one rule: she may only buy for herself.':
          '購物中心，一個小時，只有一條規則：她只能買給自己。',
        'The whole teardown out of one prep room without once looking at a note - and three cold rice balls on the desk for a club that had left an hour before. \'Not everyone. Not what\'s left over. YOU.\' She got as far as \'I\' and could not find the verb. He tore a bun in half and put the bigger half in her hand.':
          '一眼筆記都沒看，就把整場收尾從一間整備室裡調度完畢——而桌上三個冷掉的飯糰，是留給一個一小時前就走掉的社團的。「不是問大家。不是問剩下什麼。是妳。」她只說出一個「我」字，找不到動詞。他把一個麵包撕成兩半，把比較大的那一半放進她手心。',
        'Half a bun, and the only thing she did not give away':
          '半個麵包，和她今天唯一沒有分給別人的東西',
        '{{user}} gave Sui one hour at the mall with one rule - she could only buy for herself - and she filled a basket entirely with other people\'s things without noticing, so he put it all back and chose three things for her instead, correct ones, from watching; when she asked how he knew he said she was not hard to look at, and she got the second half of that about half a second later, and then stopped in the middle of the word Mama and could not finish either sentence.':
          '{{user}}給了すい一個小時和一條規則——她只能買給自己——而她完全沒有察覺地把一整籃別人的東西裝了起來，所以他把那些東西全部放回去，改成替她挑了三樣，三樣都挑對了，因為他一直在看；當她問他是怎麼知道的，他說她並不難看，而她大概半秒之後才聽懂那句話的另一半，接著在「Mama」這個詞的中間停了下來，兩個版本的句子都說不完。',
        'Her flat, after school. She went home before the last bell and she lives alone.':
          '她的公寓，放學之後。她在放學鐘響之前就先回家了，而且她一個人住。',
        'One hour, one rule - only for herself - and a basket holding a hair clip, socks in the wrong size, club-room tea and a sewing gauge. So he put it all back and chose three things she would never buy. \'You\'re not hard to look at.\' She got the second half half a second later, in a shop, with a queue behind her.':
          '一個小時、一條規則——只能買給自己——結果籃子裡是一個髮夾、一雙尺寸不對的襪子、社團教室要用的茶葉，還有一把裁縫尺。於是他把東西全部放回去，替她挑了三樣她這輩子都不會替自己買的東西。「妳並不難看。」她大概半秒之後才聽懂另一半，在店裡，後面還排著隊。',
        'Three things chosen by somebody who was watching':
          '三樣由一個一直看著她的人挑的東西',
        'Sui went home before the last bell with a fever and {{user}} came to her flat with meat in his bag, and her fridge was completely empty because the day before had gone on sitting with a first-year whose grandmother had been taken into hospital; he made her rice congee with an egg on it, asked what she had left for herself, and when she had no answer he carried it to the bed, pressed her back against the headboard and told her to stay where she was and open her mouth - and she did, and for the first time in her life she did as she was told, and neither of them said another word.':
          'すい發燒，在放學鐘響之前就先回家了，而{{user}}帶著一點生肉到了她的公寓；她的冰箱完全是空的，因為前一天全花在陪一個學妹——那個孩子的奶奶被送進了醫院；他用那些肉替她煮了一鍋加蛋的粥，問她給自己留了什麼，而她答不出來；於是他把粥端到床邊，一手把她按回床頭板上，叫她待著不要動、把嘴張開——而她照做了，那是她這輩子第一次按別人說的去做，而之後兩個人都再也沒有說過一句話。',
        'The classroom after the bell. A sentence she cannot say out loud.':
          '放學後的教室。一句她說不出口的話。',
        'A fever, an early bus home, and a fridge with nothing whatsoever in it - because the day before had gone on somebody else\'s grandmother, as every day goes on somebody. He had brought meat. Congee, with an egg on it. \'Then what about YOURSELF? Ms Mama of the complete world?\' A full minute of silence. Then a hand flat on her shoulder, the headboard at her back, and \'stay where you are. And open your mouth.\' She did. Nothing else was said by anybody.':
          '發燒、一輛提早回家的公車，和一個什麼都沒有的冰箱——因為前一天花在別人的奶奶身上，就像每一天都花在別人身上。他帶了肉來。一鍋加蛋的粥。「那妳自己呢？全世界的 Mama 小姐？」整整一分鐘的沉默。然後是一隻按在她肩上的手、背後的床頭板，和「待著不要動。把嘴張開。」她照做了。之後沒有任何人再說任何話。',
        'The first instruction she has ever followed':
          '她這輩子第一次照做的一道命令',
        'Sui\'s scolding came out at half strength in front of the three girls who fear it most and all three of them noticed and none of them liked it; afterwards {{user}} asked her to say one sentence out loud - that he was one of hers - and she could not get it out, and tried twice, and he did not explain why and left her with it.':
          'すい的責罵只用了一半的力道就出來了，而全年級最怕那個聲音的三個女生全都聽出了那代表什麼，而且沒有一個人樂見；事後{{user}}要她把一句話說出口——說他是她的孩子之一——而她說不出來，試了兩次，然後他沒有解釋原因，就把那句話留給了她。',
        'The cafeteria at lunch. Her own line, pointed the other way.':
          '午休的餐廳。她自己的那句話，被掉了個方向。',
        'A broadside that came out at half strength, and the three girls in the year who are most afraid of her all worked out what it meant and none of them enjoyed it. Then: \'say it. He\'s one of mine.\' Twice. It would not come out, and he did not explain why, and went home, and left it with her.':
          '一頓只用了一半力道的責罵，而全年級最怕她的那三個女生全都推敲出了那是什麼意思，而且沒有一個人覺得高興。然後是：「說啊。『他是我的孩子之一。』」兩次。那句話出不來，而他沒有解釋原因，就回家了，把它留給了她。',
        'A sentence that would not come out':
          '一句說不出口的話',
        '{{user}} put a full plate in front of Sui in the cafeteria and used her own line back on her - eat every last bite, there\'s a good girl - loudly enough for the room, and she put her forehead on the table and then ate all of it; he straightened her collar and did up her ribbon while she sat with her hands in her lap, she said that was not fair and he agreed, and then a sentence she started with the word Mama would not take the word.':
          '{{user}}在餐廳裡把一整盤食物放到すい面前，然後用她自己的那句話回敬她——要全部吃完，這才乖——而且音量大到整間餐廳都聽得見，於是她把額頭抵在桌上，然後把那盤東西全部吃完了；他替她整理衣領、把鬆掉的緞帶重新繫好，而她就把手放在腿上坐著讓他弄；她說這樣不公平，他說對；然後她有一句以「Mama」開頭的話，再也裝不下那個詞了。',
        'The park after school. A cheap plastic box that holds one portion.':
          '放學後的公園。一個只裝得下一人份的廉價塑膠盒。',
        '\'You\'ll eat every last bite. ...There\'s a good girl,\' loudly enough for the cafeteria, and her forehead went on the table and she ate every bite of it. He straightened her collar and did up her ribbon while she sat with her hands in her lap. \'...That\'s not fair.\' \'No.\' Then a sentence would not take the word Mama.':
          '「你要全部吃完喔。……這才乖。」音量大到整間餐廳都聽得見，而她的額頭抵上了桌面，然後把那一盤全部吃完了。他替她整理衣領、繫好緞帶，而她把手放在腿上坐著。「……這樣不公平。」「對。」然後有一句話，再也裝不下「Mama」這個詞。',
        'Her own line, pointed the other way':
          '她自己的那句話，被掉了個方向',
        '{{user}} packed Sui a lunch in a cheap plastic box that holds one portion and handed it to her in the park, and she ate the badly made thing in it first; then a sentence would not take the word Mama, so she said \'I\' instead and that she liked this one, and asked him to say her name, and afterwards she said out loud, to nobody, that she was hungry - which is the first thing she has ever wanted in front of anybody.':
          '{{user}}用一個只裝得下一人份的廉價塑膠盒替すい做了一份便當，在公園裡交到她手上，而她第一口先吃了裡面做得最差的那一樣；接著有一句話再也裝不下「Mama」這個詞，於是她改說了「我」，說她喜歡這一個，然後請他念一次她的名字；而在那之後，她對著誰也不是的空氣說出口——她餓了——那是她這輩子第一次，在別人面前說出自己想要什麼。',
        'She said what she wanted. (series complete)':
          '她說出了自己想要什麼。（系列完結）',
        'A cheap plastic box that holds one portion, in the park, with the badly made thing eaten first. Then a long pause, and \'I.\' And \'I like this one.\' She asked him to say her name, and had to put the box down. And then, to nobody at all: \'...I\'m hungry.\'':
          '一個只裝得下一人份的廉價塑膠盒，在公園裡，而裡面做得最差的那一樣被第一口吃掉了。然後是一段很長的停頓，還有「我。」和「我喜歡這一個。」她請他念一次她的名字，然後只好把盒子放到草地上。接著，對著誰也不是的空氣：「……我餓了。」',
        'The first thing she has ever wanted out loud':
          '她這輩子第一次說出口的、自己想要的東西',
        'Read Slowly':
          '「慢慢地讀」',
        'The quietest girl in the year reads every room she sits in and has never once been read back; nothing aimed at her ever arrives, which is why nobody has ever managed it.':
          '全年級最安靜的那個女生，把她坐過的每一個房間都讀得清清楚楚，自己卻從來沒有被人讀懂過；任何朝著她而去的東西都到不了她那裡，所以從來沒有人做得到。',
        'Suzu Yukishiro sat through a rota being divided up around her without answering a single question, and the page of her book did not turn once while it happened; after the others had gone she went to the board and moved one girl out of a slot that clashed with that girl\'s club, in her own handwriting, and left, and {{user}} was the only person left in the room who saw her do it.':
          '雪代鈴坐在一場在她身邊進行的輪值分配裡，一個問題也沒有回答，而她書上的那一頁自始至終一次都沒有翻動；等其他人都走了以後，她走到黑板前，用自己的字把一個女生從一個和社團時間衝突的時段挪了出去，然後就離開了——而{{user}}是教室裡唯一一個看見她做這件事的人。',
        'The library at lunch. She does not believe a thing until somebody has checked it.':
          '午休的圖書室。除非有人真的去查證過，否則她不相信任何說法。',
        'A rota divided up around her while her page did not turn once. Then, after they had gone, one name moved on the board in a hand that does not belong in a classroom. She caught a clash nobody else caught, in a conversation she was not given a vote in, and told nobody she had done it.':
          '一場在她身邊分配完畢的輪值，而她的那一頁一次都沒有翻動。等人走光了，黑板上有一個名字被挪了位置，字跡漂亮得不該出現在教室裡。她在一場自己連發言權都沒有的討論裡，抓到了沒有任何人抓到的衝突，然後誰也沒告訴。',
        'One line worth writing down: the page stopped':
          '一行值得寫下來的東西：那一頁停住了',
        'Urara repeated something she had heard and Suzu asked who she had heard it from and said that was one source, so {{user}} went and checked it himself and put the printed thing on the table without a word; Suzu looked up, which she had not done all afternoon, and said that he had gone and checked, and thanked him, and moved her bag off the chair beside her.':
          'うらら轉述了一件她聽來的事，而鈴問她是聽誰說的，並說那只是一個來源，於是{{user}}自己跑了一趣去查證，把印出來的那張東西一聲不響地放在桌上；鈴抬起了頭——整個下午她一次都沒有抬過頭——說他去查過了，向他道謝，然後把自己的書包從旁邊那張椅子上拿了下來。',
        'Lunch, and the four things she will say all hour. Read them correctly.':
          '午休。整整一個小時裡，她只會給出四個訊號。把它們全部讀對。',
        '\'Who did you hear it from.\' \'That\'s one source.\' Then a twenty-minute walk to fetch the printed page itself - and she looked up, which she had not done all afternoon. \'You went and checked. ...Thank you.\' And the bag came off the chair beside her.':
          '「妳是聽誰說的。」「那只是一個來源。」然後是一趣二十分鐘的路，把印出來的那張東西本身帶了回來——而她抬起了頭，那整個下午她一次都沒有抬過頭。「你去查過了。……謝謝。」接著，旁邊那張椅子上的書包被拿了下來。',
        'A chair cleared, with nothing said about it':
          '一張椅子，被清空，而且隻字未提',
        'Over one lunch Suzu produced four things - an \'Mm\', a page turned, a \'Noted\' and one complete sentence - and {{user}} read all four correctly, and when somebody apologised to him for her not talking she said that most people fill silence because they fear it and she does not; Nene worked out what was happening at that table before Suzu did.':
          '一頓午餐裡鈴總共只給出四樣東西——一聲「噔」、翻過去的一頁、一句「知道了」，以及一個完整的句子——而{{user}}把四樣全部讀對了；當有人替她向他道歉、說她就是不愛講話時，她說大多數人填滿沉默是因為害怕沉默，而她不會；ねね比鈴自己更早看出那張桌子上正在發生什麼事。',
        'The corridor. A test she will not perceive at all.':
          '走廊。一場她根本不會察覺到的測試。',
        'An \'Mm\', a page turned, a \'Noted\' and one complete sentence - all four read back correctly at a table of witnesses. \'Most people fill silence because they fear it. I don\'t.\' Nene worked out what was happening at that table before Suzu did.':
          '一聲「噔」、翻過去的一頁、一句「知道了」，還有一個完整的句子——四樣全部在一桌證人面前被讀了回來。「大多數人填滿沉默是因為害怕沉默。我不會。」ねね比鈴自己更早看出那是怎麼回事。',
        'Four signals, read at a table of witnesses':
          '四個訊號，在一桌證人面前被讀對',
        '{{user}} keeps a dated notebook on Suzu with the wrong guesses crossed out and corrected in it, and he tested her in front of the whole class by stopping somebody taking her window seat, loudly enough that three girls and Urara registered it; Suzu arrived, sat down and read, and had not perceived any of it, so he wrote down that she cannot be told, only shown, and not directly.':
          '{{user}}為鈴記了一本標了日期的筆記本，裡面把猜錯的地方劃掉再改正；他當著全班的面用最大聲的方式做了一次測試，攔下一個正要坐上她窗邊座位的人，大到三個女生和うらら都注意到了；鈴進來、坐下、開始看書，而那整件事沒有一絲一毫到達她那裡，於是他寫下：她沒辦法被告知，只能被展示，而且不能直接展示。',
        'The study table. Somebody else\'s frost, aimed and missed.':
          '自習的長桌。別人瞑準了她，卻整發落空。',
        'A dated notebook with a third of it crossed out, and the loudest kind thing he could legally do, in front of a full classroom. She came in, sat down and read, and none of it had arrived. \'She cannot be told. She can only be shown, and not directly.\'':
          '一本標了日期、被劃掉三分之一的筆記本，還有一次他在合法範圍內能做到最大聲的善意，當著滿教室的人。她進來、坐下、開始看書，而那整件事根本沒有抵達。「她沒辦法被告知。只能被展示，而且不能直接展示。」',
        'A null result, paid for in public':
          '一個當眾付了代價換來的零結果',
        'Yuzuki put an edge on a sentence across the study table and Suzu answered its literal content helpfully and missed the edge completely, so when Yuzuki left early {{user}} told her quietly that Suzu had not heard it and that nothing aimed at Suzu ever arrives; Suzu saw the two of them talk, asked what he had said, was told a fact about her own conduct that she did not have, said she had not noticed, and then asked how he had.':
          'ゆず姫隔著自習桌說了一句帶刺的話，而鈴照著字面意思非常訠懇、非常完整地回答了它，完全沒有接到那根刺，所以當ゆず姫提早收東西離開時，{{user}}在門口低聲告訴她鈴根本沒聽見，而且任何瞑準鈴的東西都到不了她那裡；鈴看見他們兩個在門口說話，開口問他說了什麼，被告知了一個關於她自己行為、而她手上沒有的事實，說她沒有察覺到，然後問他是怎麼察覺的。',
        'The roof. She is bringing written questions.':
          '屋頂。她會帶著寫好的問題來。',
        'Yuzuki\'s edge answered on its literal content and missed entirely - and then three quiet sentences at the door about why. A fact about her own conduct, handed to her by somebody she has never rated as her equal. \'...I did not notice.\' \'How did you.\'':
          'ゆず姫的那根刺被照字面意思回答掉了，完全落空——然後是門口那三句話。一個關於她自己行為的事實，由一個她從來沒把對方當成同級的人交到她手上。「……我沒有察覺到。」「你是怎麼察覺的。」',
        'A cause she could not reconstruct':
          '一個她重建不出來的因果',
        'Suzu came to the roof with written questions and asked how long {{user}} had been watching her, what he was looking for and how he knows when he is wrong, and he gave her the whole method - watch, guess, test the guess, change it, and mostly it is wrong; she told him that was not sufficient because anybody could do it, and he agreed, and she ended the conversation, and he said she would test it and she said yes.':
          '鈴帶著寫好的問題上了屋頂，問{{user}}觀察她多久了、在找什麼、以及他怎麼知道自己錯了，而他把整套方法原原本本地給了她——觀察、猜測、拿一件小事去驗證那個猜測、錯了就改，而且大多數時候是錯的；她告訴他那不足以解釋，因為那是任何人都做得到的事，而他說對，然後她結束了對話，而他說她會去驗證，她說會。',
        'The library. A thing she has said nothing about all afternoon.':
          '圖書室。一件她整個下午都隻字未提的事。',
        '\'How long have you been watching me.\' \'What are you looking for.\' \'How do you know when you are wrong.\' The whole method, given plainly, and rejected for being something anybody could do. Then: \'You won\'t believe it until you\'ve tested it.\' \'Yes.\'':
          '「你觀察我多久了。」「你在找什麼。」「你怎麼知道自己錯了。」整套方法原原本本地被說了出來，然後因為「任何人都做得到」而被否決。接著：「妳不驗證過就不會相信。」「會。」',
        'The true answer, refused for being too dull':
          '真正的答案，因為太乏味而被拒絕',
        'A piece of Suzu\'s writing was printed unsigned and read out in class for a laugh by somebody who did not know it was hers, and she said nothing about it all afternoon; {{user}} found her in the library and told her the thing she had not said - that she had been sitting there not asking who had chosen it, because she wanted to know whether whoever chose it had read it properly - and she went still, and said \'how\', and then that she would determine how.':
          '鈴的一篇文章不具名地印了出來，被一個根本不知道那是她寫的人在課堂上當笑話唑了出來，而她整個下午對這件事一個字也沒有說；{{user}}在圖書室找到她，把她沒有說出口的那件事說了出來——她整個下午坐在那裡，沒有去問是誰選的，因為她想知道的是選的那個人有沒有好好讀過它——而她整個人定住了，說了一聲「怎麼」，然後說她會查清楚是怎麼回事。',
        'An empty room and six handwritten questions. The first of her three tests.':
          '一間空教室，和六道手寫的題目。她三場測試的第一場。',
        'Her writing, printed unsigned and read out for a laugh by somebody who did not know. Then, in the library: \'You\'ve been sitting here all afternoon not asking who chose it.\' She went still, and the page did not turn. \'...How.\' \'I will determine how.\'':
          '她的文章不具名地印了出來，被一個不知情的人當笑話唑掉。然後，在圖書室裡：「妳整個下午坐在這裡，沒有去問是誰選的。」她定住了，那一頁沒有再翻動。「……怎麼。」「我會查清楚。」',
        'Read correctly, once, for the first time':
          '第一次，被準確地讀懂了一回',
        'Suzu set {{user}} the private exam she uses to decide whether a person is worth talking to and he wrote \'I don\'t know\' on four of the six and handed it back early on purpose, because straining would have spoiled a clean result; then he told her she had forgotten a control, so she pointed at a girl neither of them knew and he read her and ranked his own confidence, and three of four were right and the wrong one was the one he had flagged, and Suzu wrote down that intelligence does not explain it.':
          '鈴拿出她私下用來判斷一個人值不值得說話的那份考題給{{user}}，而他在六題裡有四題寫了「我不知道」，並且刻意提早交卷，因為硬撐會毀掉一個乾淨的結果；接著他告訴她她漏了對照組，於是她指向一個兩人都不認識的女生，而他讀了她，還把自己的把握程度排了序，四項中三項正確，錯的那一項正是他自己標出來的那一項，於是鈴寫下：聪明無法解釋這件事。',
        'A tally sheet and a control group. Her second test.':
          '一張記數表和一個對照組。她的第二場測試。',
        '\'I don\'t know\' on four of six, handed back early on purpose so the result would be clean - and then \'You forgot a control.\' A stranger read in thirty seconds, with his own confidence ranked, and the one he flagged was the one he got wrong. \'Intelligence does not explain it.\' One of her three hypotheses is dead.':
          '六題裡四題寫了「我不知道」，而且刻意提早交卷，好讓結果是乾淨的——然後是「妳漏了對照組」。一個陌生人，三十秒，連同他自己排序過的把握程度，而他標出來最沒把握的那一項，正是他錯的那一項。「聪明無法解釋這件事。」她三個假設裡的第一個死了。',
        'A hypothesis dead, and a calibration that was worse':
          '一個死掉的假設，和一份比命中率更難看的校準',
        'Suzu ran a blinded trial with Urara as the control and a tally, and slipped herself into her own sample expecting to be the outlier, and {{user}} read her correctly in front of everybody; before it started he had given Nanoka a folded paper that said Suzu would put herself in the sample and that she would afterwards ask whether somebody had told him, and Suzu put that paper in her book as a bookmark and said that luck does not explain it either.':
          '鈴辦了一場盲測，用うらら當對照組，還有一張記數表，而她把自己偷偷放進了自己的樣本裡，以為自己會是那個推翻結論的例外，結果{{user}}當著所有人的面把她讀對了；在開始之前他就把一張摺好的紙交給了菜乃花，上面寫著鈴會把自己放進樣本裡，以及她之後會問是不是有人告訴過他，而鈴把那張紙夾進書裡當了書籤，並說運氣也無法解釋這件事。',
        'Her flat, and her third test, and it is the cruel one.':
          '她的公寓，還有她的第三場測試，而那是最狠的一個。',
        'Blinded subjects, Urara as the control, and a tally whose two columns stopped looking like each other. She slipped into her own sample to be the outlier and was read in front of everybody. The folded paper Nanoka had been holding for an hour said she would. \'Luck does not explain it either.\' Two of the three are dead now.':
          '盲測的受試者、當對照組的うらら，還有一張兩欄再也不像彼此的記數表。她把自己放進自己的樣本裡想當那個例外，結果當著所有人的面被讀對了。菜乃花手上那張摺了一小時的紙，早就寫著她會這麼做。「運氣也無法解釋這件事。」三個裡面已經死了兩個。',
        'A folded paper, kept as a bookmark':
          '一張摺好的紙，被留下來當書籤',
        'Suzu asked {{user}} to her flat, told him she had asked eleven people and that nobody had told him anything about her, and accused him of assembling her for a reason, because people are accurate about the things they want; he put his notebook on her desk instead of arguing, and she counted a hundred and six entries of which thirty-one were corrections, and said that a person who had been told would not have been wrong thirty-one times, and asked why he had never asked anybody about her, and he gave her back her own rule.':
          '鈴把{{user}}叫到她的公寓，告訴他她問過十一個人，沒有任何人跟他說過關於她的事，並指控他是有目的地在拼湊她，因為人對自己想要的東西總是特別準確；他沒有辩解，而是把自己的筆記本放在她桌上，而她數出了一百零六則記錄，其中三十一則是訂正，並說一個被告知過的人不會錯三十一次，然後問他為什麼從來沒有向任何人打聽過她，而他把她自己的規則還給了她。',
        'She said stay. (series complete)':
          '她說了「留下來」。（系列完成）',
        '\'I asked eleven people. Nobody has told you anything about me.\' Then the notebook, and a hundred and six entries with thirty-one corrections in them. \'A person who had been told would not have been wrong thirty-one times.\' And her own rule, handed back. \'...Stay. I think I would like you to know the rest of me. ...slowly.\'':
          '「我問過十一個人。沒有人跟你說過關於我的事。」然後是那本筆記本，一百零六則記錄，其中三十一則是訂正。「一個被告知過的人，不會錯三十一次。」接著，她自己的規則被還了回來。「……留下來。我想，我願意讓你知道我剩下的部分。……慢慢地。」',
        'Read, and not merely heard':
          '被讀懂，而不只是被聽見',
        'Party of Two':
          '「兩個人的派對」',
        'The party girl of the year has never once been in an empty room on purpose, and everything she does is built so she never has to be.':
          '這一屆的派對女孩從來沒有自願待在一個空房間裡過，而她做的每一件事，都是為了永遠不必如此。',
        'Kozuzu Fuyumine was running a crowd at the school gate after the bell, assembling everybody else\'s evening by name and free period and pulling {{user}} into it without ever having spoken to him; she never once said where she herself wanted to go, and when the group finally moved she was the last one through the gate, still adding people, making it take as long as it could.':
          '冬峰小鈴放學後在校門口指揮著一群人，靠名字和空堂時間替每個人安排晚上的行程，還把從沒說過話的{{user}}拉了進去；她從頭到尾沒有說過一次自己想去哪裡，而當人群終於動身時，她是最後一個走出校門的，還在往裡面加人，讓這一切拖得越久越好。',
        'The mall after school. She has decided your clothes are a crime, and she is right.':
          '放學後的購物中心。她已經認定你的衣服是犯罪，而她是對的。',
        'A crowd at the gate run by name and free period, and you pulled into it without ever having spoken to her. She never said where she wanted to go. She was the last one through the gate, still adding people, making it take as long as it could.':
          '校門口一群人，靠名字和空堂時間指揮著，而你從沒跟她說過話就被拉了進去。她一次也沒說自己想去哪。她是最後一個走出校門的，還在往裡加人，讓這一切拖得越久越好。',
        'Last one through the gate, and she made it take as long as it could':
          '最後一個走出校門，而且她讓這一切拖得越久越好',
        'Kozuzu took {{user}} shopping and rebuilt him in forty minutes, reading his build and colouring in seconds and getting every piece right, and bought three things for herself on the way past without looking at any of them; every time the trip could have ended she added one more shop, one more crepe, one more thing, and at the corner where they split she had already started planning the next one.':
          '小鈴帶{{user}}去買衣服，四十分鐘就把他整個人重新打造了一遍，幾秒鐘就看出他的體型和膚色，每一件都挑對了，還順路替自己買了三樣東西，一眼都沒看；每次這趣出門可以結束的時候，她就再加一間店、再一個可麗餅、再一樣東西，而走到分開的那個路口時，她已經在計畫下一次了。',
        'Lunch, and a queue at her desk. Send her one message with nobody else in it.':
          '午休，她桌前排著一列人。傳一則只有她一個人的訊息給她。',
        'Forty minutes and you are a different person, one you would actually be. Three things for herself, bought without looking. One more shop, one more crepe, one more thing - every time it could have ended, she added something. At the corner she was already planning the next one.':
          '四十分鐘，你變成了另一個人，一個你真的會當的人。替自己買了三樣東西，看都沒看。再一間店、再一個可麗餅、再一樣東西——每次可以結束的時候，她都再加一點。走到路口時，她已經在計畫下一次了。',
        'Rebuilt in forty minutes by somebody who was right about all of it':
          '四十分鐘被重新打造，而動手的人每一件都對',
        'Kozuzu ran a lunchtime clinic at her desk with four girls queueing for it, fixing colour, length and hair in about two seconds each and being right every time and charging nothing, and named the thing currently on every second girl in the corridor as something she had called weeks earlier and was already bored of; {{user}} noticed every consultation had an audience, and that when the quiet girl asked to do it just the two of them Kozuzu said yes and brought three others, so he tested it with one message about a crepe shop, and the fastest thumbs in the year typed, deleted, put the phone face-down and took forty minutes to send four words, and an hour later she sent him a sticker on her own and did not look up.':
          '小鈴在自己桌前開了一整個午休的門診，四個女生排隊等著，顏色、長度、頭髮每個大約兩秒就解決，每次都對，而且不收錢，還把走廊上每兩個女生就有一個在穿的那個東西，說成是她幾週前就講過、現在已經膩了的；{{user}}注意到每一次諮詢都有觀眾，而當那個安靜的女生問能不能只有她們兩個人做的時候，小鈴說好，然後帶了另外三個人一起去，於是他用一則關於可麗餅店的訊息測試了一下，全年級最快的拇指打了又刪、把手機翻過去蓋著，花了四十分鐘才送出四個字，而一個小時後她自己傳了一張貼圖過來，沒有抬頭。',
        'The gym after school. She is sending you into the storage room, and following you in.':
          '放學後的體育館。她要派你進倉庫，然後跟著你進去。',
        'A queue four girls deep at her desk all lunch - colour, length, hair, about two seconds each, right every time, free. The corridor\'s current trend is one she called weeks ago and is already bored of. Every consultation had an audience, including the one that asked for none. One message about a crepe shop: typed, deleted, face-down, forty minutes, four words. Then a sticker, unprompted.':
          '四個女生在她桌前排隊排了整個午休——顏色、長度、頭髮，每個大約兩秒，每次都對，而且不收錢。走廊上現在最流行的那個，是她幾週前就講過、現在已經膩了的。每一次諮詢都有觀眾，連那個開口要求沒有觀眾的也一樣。一則關於可麗餅店的訊息：打了、刪了、手機翻過去蓋著、四十分鐘、四個字。然後一張貼圖，沒人要求。',
        'Four words in forty minutes, from the fastest thumbs in the year':
          '四十分鐘四個字，出自全年級最快的拇指',
        'Kozuzu and {{user}} got shut in the gym storage room and she was fine while she was talking and went to pieces in the first silence, and he found the thing nobody has ever found: he went quiet on purpose and she spiked, spoke and she settled, same walls, same air; when a girl let them out she was loud and fine in a second and made him swear not to tell anyone, and she believed with her whole heart that it was the size of the room.':
          '小鈴和{{user}}被關在體育館的倉庫裡，她講話的時候沒事，第一次安靜下來就崩潰了，而他發現了從來沒有人發現的事：他故意不出聲，她就發作；他一開口，她就平靜下來，同樣的牆、同樣的空氣；有個女生放他們出來時，她一秒鐘就恢復了大聲和沒事，還逼他發誓不告訴任何人，而她打從心底相信那是因為房間太小。',
        'Airi is doing a bit. Watch Kozuzu watch her leave.':
          'アイリ正在搞笑。看著小鈴看她離開。',
        'The storage room door swung shut. Fine while she was talking, gone to pieces in the first silence. Quiet on purpose - she spiked. Spoke - she settled. Same walls, same air. She swore you to secrecy and believed, completely, that it was the size of the room.':
          '倉庫的門甩上了。講話時沒事，第一次安靜就崩潰了。故意不出聲——她發作。一開口——她平靜。同樣的牆，同樣的空氣。她逼你保密，而且打從心底相信，那是因為房間太小。',
        'The wrong variable, and she has it with her whole heart':
          '錯的變數，而她全心全意相信著它',
        'Airi did a bit and left, and Kozuzu told {{user}} in one fond, instant sentence exactly what is wrong with Airi - that she thinks nobody will want her around if she stops being funny; when he asked what happens if Kozuzu stops, she did not understand the question, said she does not do it because she has to, she just does not like when it is over and everyone goes home, and was loud again before any of it landed.':
          'アイリ搞了個笑就走了，而小鈴用一句溫柔又即時的話，告訴了{{user}}アイリ的問題到底是什麼——她以為如果自己不再好笑，就沒有人會想要她在身邊；當他問小鈴如果她停下來會怎樣，她聽不懂這個問題，說她不是因為不得不才這樣做的，她只是不喜歡結束、不喜歡大家都回家的時候，然後在這些話落地之前就又大聲了起來。',
        'A table booked for eight. Watch how many turn up.':
          '訂了八個人的位子。看看會來幾個。',
        '\'She thinks if she stops being funny, nobody\'ll want her around.\' Airi, diagnosed in a sentence. Then: \'Stop what?\' She does not do it because she has to. She just does not like when it is over and everyone goes home. Loud again before it landed.':
          '「她以為自己不好笑了，就沒人會想要她在身邊。」一句話就把アイリ說清楚了。然後：「停什麼？」她不是因為不得不。她只是不喜歡結束、大家都回家的時候。話還沒落地，她就又大聲了。',
        'The difference between two girls, said by the one who could not hear it':
          '兩個女孩的差別，由聽不見自己在說什麼的那個說了出來',
        'Kozuzu booked a table for eight and watched six of them cancel one by one with a grin getting tighter, and then threw the whole party anyway for two people at full volume - the toast, the photo, the dumb game - and somewhere in the second hour stopped mid-sentence, because she was having a good time and it made no sense to her; she said huh, and that this was totally fine, and sounded puzzled rather than sad.':
          '小鈴訂了八個人的位子，看著六個人一個接一個取消，笑容越來越僵，然後還是把整場派對辦了下去——乾杯、拍照、蠢遊戲——只有兩個人，全音量；第二個小時的某個時候她講到一半停了下來，因為她玩得很開心，而這對她來說完全說不通；她說了一聲「咦」，說這樣完全沒問題，聽起來是困惑，而不是難過。',
        'The roof after school. She turned something down, and she cannot say why.':
          '放學後的屋頂。她推掉了一件事，而她說不出為什麼。',
        'Eight booked, six cancelled, and the whole party thrown anyway for two people at full volume - the toast, the photo, the dumb game. Then, mid-sentence, in the second hour: \'...huh.\' This was totally fine. She sounded puzzled, not sad.':
          '訂了八個，取消了六個，然後整場派對還是照辦，兩個人，全音量——乾杯、拍照、蠢遊戲。然後，第二個小時，講到一半：「……咦。」這樣完全沒問題。她聽起來是困惑，不是難過。',
        'A data point that does not fit, and \'huh\'':
          '一個對不上的數據點，和一聲「咦」',
        'Kozuzu turned down a big group thing for the first time in her life and told {{user}} she thought something was wrong with her, that if she was boring now people would leave, because that is how it works; he asked when she last had a good time and she got as far as the storage room and stopped, and worked it out on her own face - that she was fine when he was talking and not when he was not, and that it was never the room - and then could not do her usual exit, and asked him, quietly, to stay a little longer.':
          '小鈴這輩子第一次推掉了一場大型聚會，告訴{{user}}她覺得自己出了問題，說如果她現在變無聊了，大家就會離開，因為事情就是這樣運作的；他問她上一次玩得開心是什麼時候，而她說到倉庫就停住了，在自己臉上把它想了出來——他講話的時候她沒事，他不講話的時候她就不對勁，而那從來都不是房間的問題——然後她做不出平常那套抽身的動作，小聲地請他再多留一下。',
        'The library after school. Her experiment: the most boring thing in the world.':
          '放學後的圖書室。她的實驗：全世界最無聊的事。',
        '\'What if I\'m boring now? Boring people get left.\' Then one question - when did you last have a good time - and she got as far as the storage room and stopped. \'I was fine when you were talking.\' \'It\'s not the room, is it.\' No. And then the exit would not come, and she asked you to stay a little longer.':
          '「要是我現在變無聊了呢？無聊的人會被丟下。」然後一個問題——妳上次玩得開心是什麼時候——她說到倉庫就停住了。「你講話的時候我沒事。」「不是房間的問題，對吧。」對。然後那套抽身的動作出不來了，而她請你再多留一下。',
        'The one thing she organised a thousand evenings never to have to ask':
          '她辦了一千個晚上，就是為了永遠不必開口求的那件事',
        'Kozuzu ran her own experiment - the most boring thing in the world, the library, him reading, her doing nothing - and was in agony for ten minutes, got shushed twice, and then stopped fidgeting and sat for two hours until they were closing; walking out she said it was so boring and that she would do it again, and then, quieter, that it was never the noise.':
          '小鈴做了自己的實驗——全世界最無聊的事，圖書室，他看書，她什麼都不做——前十分鐘痛苦不堪，被噓了兩次，然後就不再動來動去，坐了兩個小時直到閉館；走出來時她說那超級無聊，說她還會再來一次，然後更小聲地說，從來都不是聲音的問題。',
        'Her party, a real one. Stay for the part after.':
          '她的派對，真正的那種。留下來看結束以後的部分。',
        'Ten minutes of agony, two shushes, then nothing - just sitting - for two hours until closing. \'That was SO boring. I\'d do it again.\' And quieter, walking out: it was never the noise.':
          '十分鐘的痛苦、兩次被噓，然後什麼都沒有——只是坐著——兩個小時直到閉館。「超無聊的。我還會再來。」走出來時，更小聲地：從來都不是聲音的問題。',
        'Two hours of nothing, and \'I\'d do it again\'':
          '兩個小時的什麼都沒有，和一句「我還會再來」',
        'Kozuzu threw a real party and was magnificent in it, and then the room emptied in waves, which is the thing that used to end her, and she stacked chairs with {{user}} in it still talking and was fine, and glanced at the empty room once and then at him and kept stacking; Airi, last out, saw her not looking at the door and said nothing about it, which is the most tactful thing Airi has ever done.':
          '小鈴辦了一場真正的派對，在裡面光芒四射，然後房間一波一波地空了——那是以前會擊垮她的事——而她在裡面跟{{user}}一起疊椅子，還在講話，而且沒事，朝空房間看了一眼、朝他看了一眼，然後繼續疊；最後一個離開的アイリ看見她沒有在看門，什麼也沒說，那是アイリ這輩子做過最體貼的事。',
        'A walk. Nothing planned, nobody else. She asked.':
          '散步。什麼都沒安排，沒有別人。她開口約的。',
        'Magnificent in her own element, and then the room emptied in waves - the thing that used to end her. Chairs stacked, still talking, fine. One glance at the empty room, one at you, kept stacking. Airi saw it on her way out and, for once, said nothing.':
          '在自己的主場光芒四射，然後房間一波一波空了——以前會擊垮她的那件事。疊椅子、還在講話、沒事。朝空房間看一眼，朝你看一眼，繼續疊。アイリ出門時看見了，而這一次，什麼都沒說。',
        'An empty room, and she did not look at the door':
          '一個空房間，而她沒有看門',
        'Kozuzu asked {{user}} to walk with nothing planned and nobody else, and told him she had worked out what she wanted and it was dumb: she thought she needed a hundred people every night so the room was never empty, and it turned out she needed one, if it was the right one, and a party of two still counts; at the corner where they always split she started to ask him to stay a little longer and did not finish, because he had not moved, and said okay, no take-backs.':
          '小鈴約{{user}}去散步，什麼都沒安排也沒有別人，告訴他她想通了自己要的是什麼，而那很蠢：她以為自己每個晚上都需要一百個人，好讓房間永遠不會空，結果她需要的是一個人，只要是對的那個，而兩個人的派對也算數；在他們平常分開的那個路口，她開始要請他再多留一下，卻沒有說完，因為他根本沒有動，然後她說好，不准反悔。',
        'She said one is enough. (series complete)':
          '她說一個人就夠了。（系列完成）',
        '\'I thought I needed a hundred people so the room\'s never empty. Turns out I need, like. One.\' A party of two still counts. Then the corner where the evening always ends, and \'stay a lil\' lon-\' and she did not finish it, because you had not moved. \'...okay. No take-backs.\'':
          '「我以為我需要一百個人，房間才不會空。結果我需要的是，嗯。一個。」兩個人的派對也算數。然後是那個每次晚上都在此結束的路口，「再多留一下——」她沒有說完，因為你根本沒動。「……好。不准反悔。」',
        'A sentence she did not have to finish':
          '一句她不必說完的話',
        'Ask About Me':
          '問問我這個人',
        'The whole town turns to look at her and not one person has ever asked her a question, so she has started trying to hide the only thing anybody sees.':
          '整座城的人都會回頭看她，卻沒有一個人問過她任何問題，所以她開始試著把大家唯一看得見的那一面藏起來。',
        'The shopping street after school. Walk through town beside her and see what the town does.':
          '放學後的商店街。陪她走一趟城裡，看看整條街會有什麼反應。',
        'A corridor turning in a wave for a girl who had not noticed, and a greeting like you went back a long way from somebody you had never met. Fifteen people spoke to her and every one of them was about how she looks. None of them asked her a question. A quarter of a second before the laugh, and nobody else was looking at her face.':
          '整條走廊像波浪一樣回過頭來，而那個原因本人完全沒察覺；一個從沒說過話的女生，用像認識很久的口氣跟你打招呼。十五個人跟她說了話，每一句都是在講她長得怎麼樣。沒有一個人問她問題。笑出來之前有那麼四分之一秒，而除了你，沒有人在看她的臉。',
        'Fifteen compliments, no questions, and a quarter of a second':
          '十五句讚美、零個問題，和四分之一秒',
        'Mana Arikawa turned a whole corridor around after the last bell without noticing she was doing it, greeted {{user}}, who she had never spoken to, as though they went back a long way, and pulled a girl standing alone at the edge into the middle of it; in ten minutes about fifteen people said something to her and every single one of them was about how she looks, and not one of them asked her a question, and there was a quarter of a second before the laugh that nobody but {{user}} was looking at her face to see.':
          '有川真奈在放學後讓整條走廊回過頭來，而她自己完全沒察覺；她對一個從沒說過話的{{user}}打招呼，口氣像是認識很久，還把一個獨自站在邊上的女生拉進人群中間；十分鐘內大約十五個人跟她說了話，每一句都是在講她的外表，沒有一個人問她問題，而在她笑出來之前有四分之一秒，除了{{user}}沒有人在看她的臉。',
        'Lunch, and her desk is surrounded again. Ask her something with nothing to do with her face.':
          '午休，她的座位又被圍住了。問她一個跟她的外表完全無關的問題。',
        'The town looking the whole way, and her turning a crepe counter into three strangers talking. A scout, a card, and a pocket with six of them in it. A drawer at home with more. Never once called. "It\'s just more of... that. You know?"':
          '一路上整座城都在看，而她把一個可麗餅攤變成三個陌生人在聊天。一個星探、一張名片，還有一個口袋裡掏出六張。家裡的抽屜還有更多。一張都沒打過。「就只是更多……那個啊。你懂吧？」',
        'Six cards in one pocket, and not one of them ever called':
          '一個口袋裡六張名片，一張都沒打過',
        'Walking through town beside Mana meant being looked at the whole way, which did not bother her at all, and she turned a crepe counter into three strangers talking to each other without meaning to; a scout stopped her with a modelling card and she was lovely to him and took it, and when her pocket came out on a bench it had six of them in it from six companies, with a drawer of them at home and not one ever called, because the thing they are offering is more people looking at the outside of her and she has never had the words to say that.':
          '陪真奈走過城裡就是一路被看著，而她完全不在意，還在無意之間把一個可麗餅攤變成三個陌生人在聊天；一個星探拿著模特兒的名片叫住她，她對他很好也收下了，而她的口袋在長椅上掏出來時，裡面有六家公司的六張名片，家裡的抽屜還有更多，一張都沒打過，因為那些名片提供的只是更多人看她的外表，而她從來沒有詞可以把這件事說出來。',
        'Before the bell, at the gate. Whatever she turns up in, greet her the way you always do.':
          '上課鐘前，校門口。不管她穿成什麼樣子，都照你平常的方式跟她打招呼。',
        'Six people at her desk and not one question about her. "What do you do on your days off?" - and the girl who never runs out of words stopped dead. Dramas, a plant, cooking that always goes wrong, early nights, and an apology for how boring it was. Then a second question, about the plant, and she stopped apologising.':
          '六個人圍著她的座位，沒有一個問起她本人。「你放假的時候都做什麼？」——那個永遠不會沒話講的女生，愣住了。看劇、一盆植物、每次都失敗的料理、很早就睡，然後開始為了這些有多無聊而道歉。接著你問了第二個問題，關於那盆植物，她就不再道歉了。',
        'A question she had never been asked, and she has not stopped smiling':
          '一個從沒有人問過她的問題，而她一直在笑',
        'Six people were around Mana\'s desk at lunch and she was warm and specific with every one of them and not one asked her anything about herself, so {{user}} waited for the crowd to thin and asked her what she does on her days off, and the girl who never runs out of words stopped dead; she answered badly, because she had never assembled it out loud - dramas, a plant, cooking that goes wrong every time, early nights - and started apologising for how boring it was until he asked a second question about the plant, and she spent the rest of lunch glancing over to check he was still there.':
          '午休時六個人圍著真奈的座位，她對每一個都既溫暖又具體，卻沒有一個人問起她本人，於是{{user}}等人散了之後問她放假時都做些什麼，而那個永遠不會沒話講的女生當場愣住；她答得很糟，因為她從來沒有把這些整理著說出口過——看劇、一盆植物、每次都失敗的料理、很早就睡——還開始為了有多無聊而道歉，直到他又問了第二個關於那盆植物的問題，而她整個午休都不時抬頭確認他還在。',
        'The shopping street again. She has doubled down, and the town has not noticed.':
          '再去一次商店街。她把偽裝加倍了，而整條街根本沒發現。',
        'An enormous hoodie, plain glasses and a mask, recognised in four seconds. Everybody stopped to ask if she was sick - more questions in one morning than she has ever had, all of them the wrong one. "I\'m... cold?" On a warm morning. You asked about the drama, and under the hood she lit up.':
          '超大的連帽外套、素面眼鏡和口罩，四秒鐘就被認出來。每個人都停下來問她是不是生病了——一個早上被問的次數比她一輩子都多，而每一個都問錯了。「我……很冷？」一個溫暖的早上。你問的是那部劇，而兜帽底下的她整個亮了起來。',
        'The only person who did not ask her what was wrong':
          '唯一一個沒問她怎麼了的人',
        'Mana came through the gate before the bell in an enormous hoodie, plain glasses, flat hair and a mask, and the entire school knew it was her in about four seconds; the disguise made it worse, because instead of walking past her every single person stopped to ask if she was sick, which was more questions than she had ever been asked in one morning and all of them the wrong one, and she told nobody why she was doing it and claimed to be cold on a warm morning, and {{user}} said good morning exactly as he always did and asked whether the drama got any better.':
          '真奈在上課鐘前穿著超大的連帽外套、素面眼鏡、放下來壓在臉前的頭髮和口罩走進校門，而全校大約四秒就認出是她；偽裝反而讓情況更糟，因為每一個人都不是走過去而是停下來問她是不是生病了，那是她一個早上被問過最多次的問題，而且全部都問錯了，她沒有告訴任何人自己為什麼這樣做，還在一個溫暖的早上說自己很冷，而{{user}}照他一直以來的方式說了早安，問她那部劇後來有沒有比較好看。',
        'The corridor after school. The other one people turn for is about to make an entrance.':
          '放學後的走廊。另一個會讓大家回頭的人正要登場。',
        'A bigger hoodie, a cap, and the town turning anyway. "You\'ve still got the look." - "I\'m wearing a HOODIE." In between: a remembered name, a lost kid, a stranger\'s shopping, an exam she asked about last time. The aura is the warmth, and the warmth is the ordinary girl. She is hiding the wrong thing, and you said nothing.':
          '更大的連帽外套、一頂帽子，而整座城還是回頭了。「你身上那個味道還在啊。」——「我穿的是連帽外套耶。」中間她還：記得一個名字、蹲下來處理一個迷路的小孩、把陌生人掉在路上的東西撿起來、問了上次就問過的那場考試。光環就是那份溫度，而那份溫度就是那個平凡女孩。她藏錯東西了，而你什麼都沒說。',
        'A whole street turned on in a hoodie, and she cannot find the switch':
          '穿著連帽外套點亮了整條街，而她找不到開關',
        'Mana doubled down with a bigger hoodie and a cap and the town turned to look at her anyway, and the same scout on the same corner told her she still had the look, which genuinely threw her; in between she had remembered the crepe girl\'s name, got down to a lost kid\'s height, pulled a stranger\'s shopping out of the road and asked a shop assistant how his exam went, and {{user}} understood that the aura is the warmth and the warmth is the ordinary girl she thinks nobody can see, so she is hiding the wrong thing, and he said nothing at all.':
          '真奈把偽裝加倍成更大的連帽外套和一頂帽子，而整座城還是回頭看她，同一個街角的同一個星探告訴她她身上那個味道還在，這件事真的讓她愣住；而在那之間，她記得可麗餅攤女生的名字、蹲下來處理一個迷路的小孩、把陌生人掉在路上的東西撿起來，還問了店員上次那場考試考得怎麼樣，於是{{user}}明白了那個光環就是那份溫度，而那份溫度就是她以為沒有人看得見的那個平凡女孩，所以她一直藏錯了東西，而他一個字都沒有說。',
        'The roof after school. She has stopped, and she does not know what any of it was for.':
          '放學後的天台。她停下來了，而她不知道那一切到底是為了什麼。',
        'The other one people turn for made an entrance, and Mana stepped back in her hoodie and was pleased for her. "Don\'t hide it. Aim it." - "I don\'t want to aim it. I just don\'t want it to be the only thing." Nobody had an answer to that, and the corridor left, and she looked over and found you already looking.':
          '另一個會讓大家回頭的人登場了，而真奈穿著連帽外套退到一旁，真心替她高興。「別藏啊。」「瞄準它。」——「我不想瞄準它。我只是不想它是唯一的東西。」沒有人接得下這句，走廊跟著她走了，而真奈回頭看向那個唯一沒轉頭的人，發現他一直在看著她。',
        '"I just don\'t want it to be the only thing"':
          '「我只是不想它是唯一的東西」',
        'Ume Natsuno made an entrance and the corridor turned for her, and Mana stepped back in her hoodie and was genuinely pleased for her and forfeited before anybody asked; Ume tipped the hood back an inch and told her not to hide it but to aim it, which is her own method and the wrong advice for Mana, and Mana said plainly that she does not want to aim it, she just does not want it to be the only thing, and Ume had no answer and left with the corridor behind her, and Mana looked over at the one person who had not turned to watch and found him already looking at her.':
          '夏乃うめ登場，整條走廊為她回頭，而真奈穿著連帽外套退到一旁，真心替她高興，沒有人開口她就先棄權了；うめ用一根手指把她的兜帽往後推了一吋，告訴她不要藏起來，要瞄準它，那是うめ自己的方法，卻是給真奈的錯建議，而真奈直白地說她不想瞄準它，她只是不想它是唯一的東西，うめ答不出來，帶著整條走廊離開了，而真奈回頭看向那個唯一沒有轉頭去看她離開的人，發現他一直在看著她。',
        'Her room, in the evening. She is going to cook, and you are going to eat it.':
          '晚上，她的房間。她要下廚，而你要把它吃完。',
        'Two weeks, a hundred people, and every one of them asking what was wrong. "You didn\'t ask. You asked about the drama. And the plant. Nobody\'s ever asked me that. Not once. In my life." Then: "You\'ve been asking since the start." And the offer - "ask me something else. Anything. Ask about me."':
          '兩個星期、一百個人，每一個都在問她怎麼了。「你沒有問。你問的是那部劇。還有那盆植物。從來沒有人問過我這個。一次都沒有。這輩子。」然後：「你從一開始就在問了。」接著是那個請求——「那你問我別的。什麼都好。問問我這個人。」',
        'She asked him to ask about her':
          '她請他問問她這個人',
        'Mana gave up on the hoodie after two weeks and told {{user}} the count on the roof: everybody came, everybody always comes, and a hundred people had asked what was wrong with her and not one had asked her anything else; she said he never asked, that he asked about the drama and the plant and what she does on her days off, which nobody had asked her once in her life, and then heard herself say that he had been asking since the start, and did not ask why - she asked him to ask her something else, anything, something that was not all of this, to ask about her, and he asked what she had burnt that week.':
          '兩個星期之後真奈放棄了那件連帽外套，在天台上把數字告訴{{user}}：大家都來了，大家永遠都會來，一百個人問過她哪裡不對勁，卻沒有一個問她別的；她說他沒有問，他問的是那部劇、那盆植物，還有她放假時都做什麼，而那是這輩子沒有人問過她一次的問題，然後她聽見自己說出他從一開始就在問了，而且沒有追問為什麼——她請他問她別的，什麼都好，某個不是這一切的東西，問問她這個人，而他問她這個星期燒焦了什麼。',
        'Town after school, and the hoodie is gone. Ask her whether all the looking bothers her.':
          '放學後的城裡，連帽外套已經不見了。問她，被所有人這樣看著，會不會困擾她。',
        'A plain room, a drama paused a third of the way through, one overwatered plant, and a drawer with forty cards in it, shut fast. She cooked. It was bad. You said so, and she was thrilled, because nobody ever has. "Nobody\'s ever been in here. It\'s just a room."':
          '一個樸素的房間、一部停在三分之一的劇、一盆澆太多水的植物，還有一個被她飛快關上的抽屜，裡面四十張名片。她下廚了。真的很難吃。你直接說了，而她超級開心，因為從來沒有人說過她的任何東西不好。「從來沒有人進來過這裡。就只是一個房間而已。」',
        'The boring part, shown on purpose, and eaten':
          '刻意拿出來的那個無聊部分，而且被吃完了',
        'Mana had {{user}} to her room, which is plain and tidy with a drama paused a third of the way through, one overwatered plant and a drawer with forty modelling cards in it that she shut fast; she cooked for him with total confidence and no method, and it was genuinely bad, and when he said so she was thrilled, because nobody has ever told her anything of hers was bad about anything ever, and at the sink with her back to him she said nobody from school had ever been in there and that it is just a room.':
          '真奈請{{user}}到她的房間，那裡樸素整齊，一部劇停在三分之一，一盆澆太多水的植物，還有一個被她飛快關上、裡面有四十張模特兒名片的抽屜；她帶著十足的自信和毫無章法替他下廚，成品真的很難吃，而他直接說了之後她超級開心，因為從來沒有人告訴過她她的任何東西不好，而她背對著他站在水槽前說，學校裡從來沒有人進來過這裡，這就只是一個房間而已。',
        'A walk with nothing arranged and nobody else. She has worked something out.':
          '一場什麼都沒安排、也沒有別人的散步。她想通了一件事。',
        'Full brightness, and the street doing what it does. The same sentence from the first corridor, the same trained laugh, and then she turned round mid-compliment to finish one about a drama. "They\'re looking at the wrong thing. But you\'re not, so." The scout\'s card went in a bin.':
          '回到全亮度，而整條街做著它一直在做的事。第一週走廊上的那句話一模一樣地又出現一次、一模一樣的那個練過的笑，然後她在讚美講到一半時轉過身，把關於那部劇的話講完。「他們看的是錯的東西。但你不是，所以。」星探的名片被丟進了垃圾桶。',
        'The first card of about fifty to go in a bin':
          '大約五十張裡，第一張被丟進垃圾桶的',
        'Mana went back to full brightness in town, ponytail and butterfly clip and all of it, and said out loud that it felt weird going back to it, and the street did what it always does - heads turning, a photo, the exact unfair-how-do-you-even sentence from the first corridor - and she laughed it off with the same trained laugh and turned round mid-compliment to finish a sentence about a drama; asked whether all the looking bothered her she said no, they are looking at the wrong thing, but {{user}} is not, and when the scout came back a third time she thanked him, said she was okay, and dropped the card in a bin.':
          '真奈在城裡回到了全亮度，高馬尾、蝴蝶髮夾，整套都回來了，還直接說出回到這樣感覺很怪，而整條街做著它一直在做的事——回頭的人潮、一張合照、第一週走廊上那句一模一樣的話——她用一模一樣的那個練過的笑帶過去，然後在讚美講到一半時轉過身，把關於那部劇的句子講完；被問到這樣被看著會不會困擾她時，她說不會，他們看的是錯的東西，但{{user}}不是，而當星探第三次出現時，她謝過他、說自己很好，然後把名片丟進了垃圾桶。',
        'She aimed her own greeting at one person. (series complete)':
          '她把自己的招呼語，第一次對準了一個人。（系列完成）',
        '"I thought if I turned it off, someone\'d finally see me. Two weeks, and everyone just asked if I was sick." The shiny part is a light that is on, and people look at lights, and somebody who wants to know what is in the room comes in anyway. "You didn\'t ask about the hoodie. You asked about the plant. I don\'t think you know how big that was." And then, to one person: "There you are."':
          '「我一直以為只要把它關掉，就會有人終於看見我。結果關了兩個星期，大家只是問我是不是生病了。」那個亮亮的部分只是一盞開著的燈，而人本來就會看燈，至於真的想知道房間裡有什麼的人，反正就是會走進來。「你知道你做了什麼嗎？你沒有問那件連帽外套。你問的是那盆植物。我覺得你不知道那有多重要。」然後，對著一個人：「你在這裡呀。」',
        'A greeting she has said a thousand times, aimed once':
          '一句說了一千次的招呼，第一次有了對象',
        'Mana asked {{user}} to walk with nothing arranged and nobody else, and told him she had worked something out and it took her three weeks: she had thought that if she turned it off somebody would finally see her, and two weeks of it only got her everybody asking if she was sick, and he never asked, he just asked - so the shiny part is only a light that is on, and people look at a light, and somebody who wants to know what is in the room comes in anyway; then she told him that he had not asked about the hoodie for two weeks while everybody else did, that he asked about the plant instead, and that she did not think he knew how big that was, and said "there you are" to one person and meant it.':
          '真奈約{{user}}去散步，什麼都沒安排也沒有別人，告訴他她想通了一件事，而且花了她三個星期：她本來以為只要把那一面關掉，就會有人終於看見她，結果關了兩個星期換來的只是所有人問她是不是生病了，而他從來沒問，他就只是問；所以那個亮亮的部分只是一盞開著的燈，人本來就會看燈，而真的想知道房間裡有什麼的人，反正就是會走進來；接著她告訴他，所有人都在問的那兩個星期裡他沒有問那件連帽外套，他問的是那盆植物，而她覺得他不知道那有多重要，然後對著一個人說了「你在這裡呀」，並且是真心的。',
        'Relax, I\'m Teasing':
          '放輕鬆，我在鬧你',
        'Everything she wants she gets by aiming her body at whoever has it, and it has never once failed; she has no idea what she has been buying.':
          '她想要的一切，都是把身體對準擁有它的人換來的，而且從來沒有失手過；她完全不知道自己一直在買的是什麼。',
        'A cafe after school. She has come looking for you, which she has never done for anybody. Ask her why you.':
          '放學後的咖啡廳。她特地來找你，這是她從來沒有為任何人做過的事。問她為什麼是你。',
        'Notes, a cleaning duty and a PE exemption collected in one corridor without asking, from two girls and a teacher - she finds what a person wants to be and hands it to them for four seconds. Then the same thing aimed at you, a stranger, and you said no, politely. A tenth of a second on her face. "Suit yourself~."':
          '一條走廊裡，沒開口就收到了筆記、一份掃除值日和一張體育課免修——來自兩個女生和一個老師；她找到每個人想成為的那個樣子，然後把它遞給對方四秒鐘。接著同一套對準了你，一個陌生人，而你客氣地說了不。她臉上十分之一秒的什麼。「隨便你囉～」',
        'Three favours nobody asked for, and one no':
          '三個沒人開口要的人情，和一個不',
        'Ume Natsuno collected a full set of notes, somebody else\'s cleaning duty and a PE exemption in one corridor without asking for any of them, from two girls and a teacher, by finding the thing each person wanted to be and handing it to them for four seconds; then she ran the same thing on {{user}}, who she had never spoken to, and he said no, politely, because a stranger wanted something from him and he did not yet know why, and her face did something for a tenth of a second before she said suit yourself.':
          '夏乃うめ在一條走廊裡沒開口就收到了一整套筆記、別人的掃除值日和一張體育課免修，來自兩個女生和一個老師，方法是找到每個人想成為的那個樣子，然後把它遞給對方四秒鐘；接著她對從沒說過話的{{user}}用了同一套，而他客氣地說了不，因為一個陌生人想從他這裡拿東西而他還不知道為什麼，她的臉閃了十分之一秒，然後說隨便你囉。',
        'Lunch. Ask her for a favour - a small, real one - and watch what she charges.':
          '午休。向她要一個人情——小小的、真實的那種——然後看她收什麼價。',
        'She came looking. The whole instrument at full power, and you stayed polite and present and talked to her like a person, which is the one thing she has no move for. "Why me? Why the whole production, for a stranger?" - "Because it\'s fun~. Is it working?" - "No." Then she paid for both drinks, and did not plan to.':
          '她特地來找你。整套武器火力全開，而你保持客氣、在場，把她當成桌子對面的一個人來聊，那是她唯一沒有招數可以應付的反應。「為什麼是我？為什麼對一個陌生人要搞這整套？」——「因為好玩啊～有用嗎？」——「沒有。」然後她付了兩杯的錢，而且沒有計畫要這麼做。',
        'She paid for both drinks and did not plan to':
          '她付了兩杯的錢，而且沒有計畫要這麼做',
        'Ume came looking for {{user}} at a cafe, which she has never done for anybody, and ran the whole instrument at full power - the closeness, the collar, the hand on his wrist - and he stayed polite and present and talked to her like a person at a table, which is the one response she has no move for; when he asked why her, why the whole production for a stranger who could have had notes from thirty people for nothing, she deflected with a joke and asked if it was working, and he said no, and she paid for both drinks without planning to.':
          'うめ特地到咖啡廳來找{{user}}，這是她從來沒有為任何人做過的事，並且把整套武器火力全開——貼近、領口、搭在他手腕上的手——而他保持客氣、在場，把她當成桌子對面的一個人來聊，那是她唯一沒有招數可以應付的反應；當他問為什麼是她、為什麼對一個明明可以從三十個人那裡免費拿到筆記的陌生人搞這整套時，她用一個笑話帶過，問他有沒有用，他說沒有，而她沒有計畫地付了兩杯的錢。',
        'The corridor after school. Somebody has been paying her price all week. Take the work, not the credit.':
          '放學後的走廊。有人這整個星期都在替她付帳。把活接過來，別把功勞接過來。',
        'You asked her for notes, plainly, and she handed them over mid-sentence with no lean and no price and did not notice she had not charged you. Then the thank-you woke her up and the instrument came back, louder and a beat too fast, aimed at a boy already back at his lunch.':
          '你直接跟她要筆記，她講到一半就遞了過來，沒有傾身、沒有價碼，也沒發現自己沒跟你收錢。接著那句謝謝把她叫醒了，那套武器回來了，比平常更大聲、快了一拍，對準一個已經回頭吃午餐的男生。',
        'A favour with no price on it, from the one girl who always charges':
          '一個沒有標價的人情，來自那個永遠收費的女生',
        '{{user}} asked Ume for a small real favour - notes for a class he missed - and she handed them over instantly, mid-sentence, with no lean and no price and without noticing that she had not charged him, which she has never once done for anybody; his thank-you woke her up and she came back louder than usual with a line about paying her back in a way they would both enjoy, aimed at a boy who had already put the notes in his bag.':
          '{{user}}向うめ要了一個小小的、真實的人情——他缺課那堂的筆記——而她講到一半就立刻遞了過來，沒有傾身、沒有價碼，也沒發現自己沒有跟他收錢，那是她從來沒有對任何人做過的事；他的謝謝把她叫醒了，她比平常更大聲地回來，說他可以用一種兩個人都會享受的方式還她，對準的是一個已經把筆記放進書包的男生。',
        'A family restaurant after school. She is telling a funny story about being twelve. Ask whether they were nice before.':
          '放學後的家庭餐廳。她在講一個關於十二歲的好笑故事。問她，在那之前大家對她好嗎。',
        'A quiet girl from the next class, four favours in five days, falling behind, still living on four seconds of being told she had taste. Ume had no idea. You did an hour of the girl\'s work and put the cleaning back on the rota under your own name, and Ume watched from the end of the corridor and could not price it.':
          '隔壁班一個安靜的女生，五天四個人情，進度落後，還靠著「你很有品味」那四秒鐘在過日子。うめ完全不知道。你替那個女生做了一小時的功課，把掃除值日用你自己的名字放回輪值表，而うめ在走廊另一頭看完了整件事，算不出它的價錢。',
        'A thing done for nothing, and she could not price it':
          '一件白做的事，而她算不出價錢',
        'A quiet girl from the next class had done four things for Ume in five days and was falling behind on her own work, still living on four seconds of being told she had good taste, and Ume had no idea, because she has never followed the thread past the moment a favour arrives; {{user}} said nothing to anybody, sat and did an hour of the girl\'s work with her and put Ume\'s cleaning duty back on the rota under his own name, and Ume watched the whole thing from the end of the corridor and could not work out what he got out of it.':
          '隔壁班一個安靜的女生五天內替うめ做了四件事，自己的功課落後了，還靠著被說過一次很有品味的那四秒鐘過日子，而うめ完全不知道，因為她從來沒有把線索追到人情送到手之後；{{user}}什麼都沒跟任何人說，坐下來陪那個女生做了一小時的功課，把うめ的掃除值日用自己的名字放回輪值表，而うめ在走廊另一頭看完了整件事，算不出他到底得到了什麼。',
        'The corridor after school. The other one people turn for is with her, and she has a question for her.':
          '放學後的走廊。另一個會讓大家回頭的人跟她在一起，而她有一個問題要問她。',
        'The summer she was twelve, told as a funny story: everything changed shape in four months and overnight everybody was so nice. "Were they nice before?" A real silence. "...No." The grin stayed on. Then the joke, on schedule.':
          '她十二歲那年夏天，當成好笑的故事講：四個月內整個人變了形，一夜之間大家都對她好起來。「在那之前他們對你好嗎？」真正的沉默。「……不好。」笑容一直掛著。然後，準時地，那個笑話。',
        '"Were they nice before?" - "...No."':
          '「在那之前他們對你好嗎？」——「……不好。」',
        'Ume told {{user}} a genuinely funny story about the summer she was twelve, when everything about her changed shape in four months and everybody was suddenly, overnight, so nice to her - the best thing that ever happened to her - and he asked whether they were nice before, and after a real silence she said no, with the grin still on, and then deflected with a filthy joke about how well it works now, and he laughed, because not laughing would have been a lecture.':
          'うめ跟{{user}}講了一個真的很好笑的故事，關於她十二歲那年夏天，整個人在四個月內變了形，而所有人突然、一夜之間對她好得不得了——她這輩子遇過最好的事——而他問，在那之前他們對她好嗎，在一段真正的沉默之後她說不好，笑容還掛著，然後用一個關於現在多有用的下流笑話帶過，而他笑了，因為不笑就變成說教了。',
        'The roof after school. She is going to ask you what it is. Ask her how she wants it to start.':
          '放學後的天台。她要來問你到底是怎麼回事。問她，她希望它怎麼開始。',
        'The corridor turned for both of them. Mana gave compliments away for nothing and was pleased, and Ume watched it like a card trick. "Doesn\'t it bother you? Giving it away for free?" - "Giving what away?" Then, too brightly, to the one person who had not turned: "She\'s SO weird."':
          '走廊為她們兩個回頭。真奈把讚美白白送出去還很開心，而うめ看著這一切像看一個看不懂的紙牌魔術。「不會困擾嗎？免費把它送出去？」——「送什麼出去？」然後，太過明亮地，對著唯一沒有轉頭的那個人：「她好奇怪。」',
        '"Giving what away?"':
          '「送什麼出去？」',
        'Ume and Mana walked into the corridor together and it turned for both of them, and Ume watched Mana give compliments away in every direction for nothing like a card trick she could not follow, and asked her, as a joke, whether it bothered her giving it away for free; Mana said "giving what away?" and left with the corridor behind her, and Ume said she was so weird, too brightly, to the one person who had not turned to watch Mana go.':
          'うめ和真奈一起走進走廊，走廊為她們兩個回頭，而うめ看著真奈把讚美往四面八方白白送出去，像看一個看不懂的紙牌魔術，然後開玩笑似地問她，免費把它送出去會不會困擾她；真奈說「送什麼出去？」然後帶著整條走廊走了，而うめ太過明亮地對著唯一沒有轉頭去看真奈離開的那個人說，她好奇怪。',
        'The classroom or the library after school. She is running an experiment with her hands in her lap. Be honest when she asks.':
          '放學後的教室或圖書室。她正在做一個雙手放在膝上的實驗。她問的時候，說實話。',
        'Angry, hands in her pockets, asking what it is: "Everybody. And not you. Am I not-" and she stopped. "Say it worked. Then what? What does it look like, much later?" No answer. "Is that how you want it to start? And how do you want it to end?" One cold sentence, the stairs, and at the top: "Ask me again. Not now. But ask me again."':
          '生著氣，雙手插在口袋裡，問到底是怎麼回事：「每一個人。除了你。是不是我不夠——」然後她停住了。「假設它有用。然後呢？很久以後，它長什麼樣子？」沒有答案。「你希望它這樣開始嗎？那你希望它怎麼結束？」一句冰冷的話、樓梯，然後在樓梯頂端：「再問我一次。不是現在。但再問我一次。」',
        '"Ask me again. Not now. But ask me again."':
          '「再問我一次。不是現在。但再問我一次。」',
        'Ume came to the roof angry and asked {{user}} outright what it was, why everybody and not him, and stopped before finishing am I not; he asked her instead to say it had worked, that he had gone red and done her cleaning - then what, what does it look like later, much later - and she had no answer, because she had never once pictured past the start; he asked whether that was how she wanted it to start and how she wanted it to end, and she gave him one cold sentence and went for the stairs, and at the top she stopped without turning and said ask me again, not now, but ask me again.':
          'うめ帶著怒氣上了天台，直接問{{user}}到底是怎麼回事，為什麼每一個人都行、就他不行，在說完「是不是我不夠」之前停住了；他反過來請她假設它有用了，假設他臉紅了、替她掃除了——然後呢，很久以後它長什麼樣子——而她答不出來，因為她從來沒有想像過開頭以後的事；他問她希望它這樣開始嗎、希望它怎麼結束，她丟下一句冰冷的話就往樓梯走，在樓梯頂端沒有回頭地停下來說，再問我一次，不是現在，但再問我一次。',
        'Karaoke or the mall, a big night, hers. Stay by the wall and let her find you.':
          '卡拉OK或購物中心，一個大場面，她的。待在牆邊，讓她來找你。',
        'Blazer done up, hands in her lap, a favour asked flat - "could I borrow that?" - and the sentence wrong the first time. She got it. She did not believe it. "Was I doing the thing? Be honest." - "You weren\'t." - "Then why did she-" - "Because you asked her." It did not go in.':
          '外套扣到最上面，雙手放在膝上，平平地開口要一個人情——「可以借我嗎？」——第一次還說錯了。她要到了。她不相信。「我剛剛有在做那個嗎？老實說。」——「你沒有。」——「那她為什麼——」——「因為你開口問了她。」這句話沒有進去。',
        '"Then why did she-" - "Because you asked her."':
          '「那她為什麼——」——「因為你開口問了她。」',
        'Ume sat through an afternoon with the blazer done up and her hands in her lap and asked the girl beside her for a page of notes flat, with no instrument at all, and got the sentence wrong the first time and could not read the room because she has only ever set one; the girl said sure and handed it over and forgot it, and Ume did not believe it, and asked {{user}} urgently whether she had been doing the thing without noticing, and he said no, she got it because she asked, and it did not go in.':
          'うめ把外套扣到最上面、雙手放在膝上坐了一整個下午，平平地、完全不用那套武器地向旁邊的女生要一頁筆記，第一次還說錯了，也讀不出房間的氣氛，因為她一直以來都只負責設定它；那個女生說好，遞了過來然後忘了這件事，而うめ不相信，急切地問{{user}}她是不是不小心做了那個，他說沒有，她拿到是因為她開口問了，而這句話沒有進去。',
        'Daylight, nothing arranged, and she is coming at you at full power. Ask what she wants, and believe the answer.':
          '白天，什麼都沒安排，而她正火力全開地朝你走來。問她要什麼，然後相信那個答案。',
        'Her night, at the top of her game, everybody giving her everything - and halfway through she saw the four seconds she pays with and what she has been buying. She sat down by the wall and stopped performing. "The worst bit is I\'m really good at it." - "I know." - "Like, REALLY good." - "I know."':
          '她的夜晚，狀態最好的時候，每個人都把一切給她——而到一半，她看見了自己付出去的那四秒鐘，和她一直在買的東西。她在牆邊坐下，不再表演。「最糟的是，我真的很擅長這個。」——「我知道。」——「是真的、真的很擅長。」——「我知道。」',
        '"I\'m really good at it." - "I know."':
          '「我真的很擅長這個。」——「我知道。」',
        'Ume ran a big night at the top of her game and everybody gave her everything, and about halfway through she stopped enjoying it - watched a girl hand her something and saw, for the first time, the four seconds she had paid for it with and that the girl had already stopped mattering to the evening; she found {{user}} by the wall and sat down and did not perform for the rest of it, and said the worst bit is that she is really good at it, and he said I know, twice.':
          'うめ在狀態最好的時候辦了一個大場面，每個人都把一切給她，而到一半她不再享受了——她看著一個女生遞東西給她，第一次看見自己付出去的那四秒鐘，也看見那個女生對這個夜晚來說已經不重要了；她找到牆邊的{{user}}，坐下來，接下來整晚都沒有表演，說最糟的是她真的很擅長這個，而他說我知道，兩次。',
        'She will keep trying on you. Beware. (series complete)':
          '她會繼續在你身上試。小心點。（系列完成）',
        'Full power, in daylight, aimed at you, and "what do you want?" - "Nothing." And it held. "You never paid. So there\'s nothing left to buy off you. Which means this isn\'t for anything. It\'s just mine. And I want it to land on you. Once." It did, almost - you went red and leaned in and caught yourself half a second late, and she saw it. "You DID. I saw it." A finger under your chin: "I\'ll keep trying on you. Beware."':
          '火力全開，在白天，對準你，然後「你要什麼？」——「什麼都不要。」而這句話站得住。「你從來沒付過錢。所以在你身上已經沒有東西可以買了。也就是說這不是為了什麼。它就只是我的。而我想讓它落在你身上。一次。」它落了，差一點——你臉紅了、傾身過去、慢了半秒才收住，而她看見了。「你有。我看見了。」一根手指抵在你下巴下：「我會繼續在你身上試。小心點。」',
        '"I\'ll keep trying on you. Beware."':
          '「我會繼續在你身上試。小心點。」',
        'Ume came at {{user}} in daylight at full power - the hair, the blouse, the walk, every piece of the instrument aimed at him at the closest range she has ever used - and when he braced and asked what she wanted she said nothing, and it was true, and it held when he tested it; she told him she wanted it to start with somebody who would have picked her anyway, that he had never once paid, so there was nothing left to buy off him, which meant this was not for anything - it was just hers, and she wanted it to land on him once, to see; and it did, almost - he went red for the first time and leaned in a fraction and caught himself half a second late, and she saw it and was delighted, reached for relax, I\'m teasing, and did not finish it, and put a finger under his chin and said she would keep trying on him, beware.':
          'うめ在白天火力全開地朝{{user}}走來——頭髮、襯衫、走路的樣子，整套武器的每一件都對準他，用她從來沒用過的近距離——而當他戒備起來問她要什麼時，她說什麼都不要，而那是真的，他測試了也站得住；她告訴他，她希望它從一個本來就會選她的人開始，而他從來沒付過一次錢，所以在他身上已經沒有東西可以買了，也就是說這不是為了什麼——它就只是她的，而她想讓它落在他身上一次，看看會怎樣；而它落了，差一點——他第一次臉紅了、傾身過去一點點、慢了半秒才收住，而她看見了，開心得不得了，伸手去拿「放輕鬆，我在鬧你」卻沒有說完，然後把一根手指抵在他下巴下，說她會繼續在他身上試，小心點。',
      },
    },
  };
  // stat_data FIELD (last path segment) -> which category table localizes it.
  // The phrase-routed fields (Desc/Title/Note/Label/Rel/summary/…) are GENERIC names shared with
  // AI-written records (Hobbies.Desc, player quests, …) — safe because an unmatched string falls
  // back to itself; only exact authored phrases translate.
  var FIELD_CAT = {
    Weather: 'weather', Mood: 'mood', Embarrassment: 'bucket', Guilt: 'bucket',
    RelationshipStage: 'stage', Mode: 'mode',
    Status: 'status',
    Type: 'phrase', Title: 'phrase', Desc: 'phrase', Objective: 'phrase',
    ProgressSummary: 'phrase', Reward: 'phrase',
    summary: 'phrase', state: 'phrase', scope: 'phrase',
    Label: 'phrase', Note: 'phrase', Rel: 'phrase',
  };
  // map an English key to its label in `lang`; unknown lang / missing key -> the key itself (English fallback).
  var labelOf = function (cat, key, lang) {
    return (I18N[lang] && I18N[lang][cat] && I18N[lang][cat][key]) || key;
  };
  var catOf = function (field) { return FIELD_CAT[field] || ''; };
  return { I18N: I18N, FIELD_CAT: FIELD_CAT, labelOf: labelOf, catOf: catOf };
});

