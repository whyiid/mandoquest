/* ===========================================================================
   MandoQuest — data.js
   All learning content: 19 categories (207 words) + sentence builder set (28).
   Each word: hanzi, pinyin, en (English), id (Indonesian, hidden in UI),
              emoji (visual; '' falls back to the English word badge),
              swatch (optional hex — colors render a real colored circle).
   Pronunciation: bundled clip pack (audio/*.mp3, Google TTS 普通话), with
   Web Speech API (zh-CN) as offline fallback. Regenerate: node tools/gen-audio.js.
   =========================================================================== */

const MANDO_DATA = {
  categories: [
    /* 1 ─ Greetings ───────────────────────────────────────────────────── */
    {
      id: 'greetings',
      name: 'Greetings',
      icon: '👋',
      color: '#FF7043',
      words: [
        { hanzi: '你好',   pinyin: 'nǐ hǎo',        en: 'Hello',         id: 'Halo',          emoji: '🙋' },
        { hanzi: '谢谢',   pinyin: 'xiè xie',       en: 'Thank you',     id: 'Terima kasih',  emoji: '🙏' },
        { hanzi: '再见',   pinyin: 'zài jiàn',      en: 'Goodbye',       id: 'Sampai jumpa',  emoji: '👋' },
        { hanzi: '对不起', pinyin: 'duì bu qǐ',     en: 'Sorry',         id: 'Maaf',          emoji: '😟' },
        { hanzi: '没关系', pinyin: 'méi guān xi',   en: "It's okay",     id: 'Tidak apa-apa', emoji: '🙆' },
        { hanzi: '早上好', pinyin: 'zǎo shang hǎo', en: 'Good morning',  id: 'Selamat pagi',  emoji: '🌅' },
        { hanzi: '晚上好', pinyin: 'wǎn shang hǎo', en: 'Good evening',  id: 'Selamat malam', emoji: '🌙' },
        { hanzi: '请',     pinyin: 'qǐng',          en: 'Please',        id: 'Silakan',       emoji: '🤲' },
        { hanzi: '是',     pinyin: 'shì',           en: 'Yes / is',      id: 'Ya',            emoji: '✅' },
        { hanzi: '不是',   pinyin: 'bú shì',        en: 'No / is not',   id: 'Bukan',         emoji: '🚫' }
      ]
    },

    /* 2 ─ Numbers ─────────────────────────────────────────────────────── */
    {
      id: 'numbers',
      name: 'Numbers',
      icon: '🔢',
      color: '#42A5F5',
      words: [
        { hanzi: '一', pinyin: 'yī',   en: 'One',    id: 'Satu',     emoji: '1️⃣' },
        { hanzi: '二', pinyin: 'èr',   en: 'Two',    id: 'Dua',      emoji: '2️⃣' },
        { hanzi: '三', pinyin: 'sān',  en: 'Three',  id: 'Tiga',     emoji: '3️⃣' },
        { hanzi: '四', pinyin: 'sì',   en: 'Four',   id: 'Empat',    emoji: '4️⃣' },
        { hanzi: '五', pinyin: 'wǔ',   en: 'Five',   id: 'Lima',     emoji: '5️⃣' },
        { hanzi: '六', pinyin: 'liù',  en: 'Six',    id: 'Enam',     emoji: '6️⃣' },
        { hanzi: '七', pinyin: 'qī',   en: 'Seven',  id: 'Tujuh',    emoji: '7️⃣' },
        { hanzi: '八', pinyin: 'bā',   en: 'Eight',  id: 'Delapan',  emoji: '8️⃣' },
        { hanzi: '九', pinyin: 'jiǔ',  en: 'Nine',   id: 'Sembilan', emoji: '9️⃣' },
        { hanzi: '十', pinyin: 'shí',  en: 'Ten',    id: 'Sepuluh',  emoji: '🔟' },
        { hanzi: '百', pinyin: 'bǎi',  en: 'Hundred', id: 'Seratus', emoji: '💯' },
        { hanzi: '零', pinyin: 'líng', en: 'Zero',    id: 'Nol',     emoji: '0️⃣' },
        { hanzi: '千', pinyin: 'qiān', en: 'Thousand', id: 'Seribu', emoji: '🔢' }
      ]
    },

    /* 3 ─ Colors ──────────────────────────────────────────────────────── */
    {
      id: 'colors',
      name: 'Colors',
      icon: '🎨',
      color: '#AB47BC',
      words: [
        { hanzi: '红色', pinyin: 'hóng sè',  en: 'Red',    id: 'Merah',  emoji: '', swatch: '#E53935' },
        { hanzi: '蓝色', pinyin: 'lán sè',   en: 'Blue',   id: 'Biru',   emoji: '', swatch: '#1E88E5' },
        { hanzi: '黄色', pinyin: 'huáng sè', en: 'Yellow', id: 'Kuning', emoji: '', swatch: '#FDD835' },
        { hanzi: '绿色', pinyin: 'lǜ sè',    en: 'Green',  id: 'Hijau',  emoji: '', swatch: '#43A047' },
        { hanzi: '白色', pinyin: 'bái sè',   en: 'White',  id: 'Putih',  emoji: '', swatch: '#FFFFFF' },
        { hanzi: '黑色', pinyin: 'hēi sè',   en: 'Black',  id: 'Hitam',  emoji: '', swatch: '#212121' },
        { hanzi: '粉色', pinyin: 'fěn sè',   en: 'Pink',   id: 'Pink',   emoji: '', swatch: '#EC407A' },
        { hanzi: '紫色', pinyin: 'zǐ sè',    en: 'Purple', id: 'Ungu',   emoji: '', swatch: '#8E24AA' },
        { hanzi: '橙色', pinyin: 'chéng sè', en: 'Orange', id: 'Oranye', emoji: '', swatch: '#FB8C00' },
        { hanzi: '棕色', pinyin: 'zōng sè',  en: 'Brown',  id: 'Cokelat', emoji: '', swatch: '#795548' }
      ]
    },

    /* 4 ─ Animals ─────────────────────────────────────────────────────── */
    {
      id: 'animals',
      name: 'Animals',
      icon: '🐾',
      color: '#66BB6A',
      words: [
        { hanzi: '猫',   pinyin: 'māo',      en: 'Cat',      id: 'Kucing',  emoji: '🐱' },
        { hanzi: '狗',   pinyin: 'gǒu',      en: 'Dog',      id: 'Anjing',  emoji: '🐶' },
        { hanzi: '鸟',   pinyin: 'niǎo',     en: 'Bird',     id: 'Burung',  emoji: '🐦' },
        { hanzi: '鱼',   pinyin: 'yú',       en: 'Fish',     id: 'Ikan',    emoji: '🐟' },
        { hanzi: '兔子', pinyin: 'tù zi',    en: 'Rabbit',   id: 'Kelinci', emoji: '🐰' },
        { hanzi: '老虎', pinyin: 'lǎo hǔ',   en: 'Tiger',    id: 'Harimau', emoji: '🐯' },
        { hanzi: '大象', pinyin: 'dà xiàng', en: 'Elephant', id: 'Gajah',   emoji: '🐘' },
        { hanzi: '熊猫', pinyin: 'xióng māo', en: 'Panda',   id: 'Panda',   emoji: '🐼' },
        { hanzi: '马',   pinyin: 'mǎ',       en: 'Horse',    id: 'Kuda',    emoji: '🐴' },
        { hanzi: '猪',   pinyin: 'zhū',      en: 'Pig',      id: 'Babi',    emoji: '🐷' },
        { hanzi: '羊',   pinyin: 'yáng',     en: 'Sheep',    id: 'Domba',   emoji: '🐑' },
        { hanzi: '牛',   pinyin: 'niú',      en: 'Cow',      id: 'Sapi',    emoji: '🐮' },
        { hanzi: '鸭',   pinyin: 'yā',       en: 'Duck',     id: 'Bebek',   emoji: '🦆' },
        { hanzi: '老鼠', pinyin: 'lǎo shǔ',  en: 'Mouse',    id: 'Tikus',   emoji: '🐭' }
      ]
    },

    /* 5 ─ Food ────────────────────────────────────────────────────────── */
    {
      id: 'food',
      name: 'Food',
      icon: '🍜',
      color: '#EF5350',
      words: [
        { hanzi: '饭',   pinyin: 'fàn',      en: 'Rice',     id: 'Nasi',    emoji: '🍚' },
        { hanzi: '面',   pinyin: 'miàn',     en: 'Noodles',  id: 'Mie',     emoji: '🍜' },
        { hanzi: '水',   pinyin: 'shuǐ',     en: 'Water',    id: 'Air',     emoji: '💧' },
        { hanzi: '牛奶', pinyin: 'niú nǎi',  en: 'Milk',     id: 'Susu',    emoji: '🥛' },
        { hanzi: '苹果', pinyin: 'píng guǒ', en: 'Apple',    id: 'Apel',    emoji: '🍎' },
        { hanzi: '香蕉', pinyin: 'xiāng jiāo', en: 'Banana', id: 'Pisang',  emoji: '🍌' },
        { hanzi: '鸡',   pinyin: 'jī',       en: 'Chicken',  id: 'Ayam',    emoji: '🍗' },
        { hanzi: '鱼',   pinyin: 'yú',       en: 'Fish',     id: 'Ikan',    emoji: '🐟' },
        { hanzi: '蛋',   pinyin: 'dàn',      en: 'Egg',      id: 'Telur',   emoji: '🥚' },
        { hanzi: '汤',   pinyin: 'tāng',     en: 'Soup',     id: 'Sup',     emoji: '🍲' },
        { hanzi: '茶',   pinyin: 'chá',      en: 'Tea',      id: 'Teh',     emoji: '🍵' },
        { hanzi: '面包', pinyin: 'miàn bāo', en: 'Bread',    id: 'Roti',    emoji: '🍞' },
        { hanzi: '菜',   pinyin: 'cài',      en: 'Vegetable', id: 'Sayur',  emoji: '🥬' },
        { hanzi: '肉',   pinyin: 'ròu',      en: 'Meat',     id: 'Daging',  emoji: '🥩' }
      ]
    },

    /* 6 ─ Family ──────────────────────────────────────────────────────── */
    {
      id: 'family',
      name: 'Family',
      icon: '👨‍👩‍👧',
      color: '#EC407A',
      words: [
        { hanzi: '爸爸', pinyin: 'bà ba',   en: 'Dad',            id: 'Ayah',          emoji: '👨' },
        { hanzi: '妈妈', pinyin: 'mā ma',   en: 'Mom',            id: 'Ibu',           emoji: '👩' },
        { hanzi: '爷爷', pinyin: 'yé ye',   en: 'Grandpa',        id: 'Kakek',         emoji: '👴' },
        { hanzi: '奶奶', pinyin: 'nǎi nai', en: 'Grandma',        id: 'Nenek',         emoji: '👵' },
        { hanzi: '哥哥', pinyin: 'gē ge',   en: 'Big brother',    id: 'Kakak laki',    emoji: '👦' },
        { hanzi: '姐姐', pinyin: 'jiě jie', en: 'Big sister',     id: 'Kakak perempuan', emoji: '👧' },
        { hanzi: '弟弟', pinyin: 'dì di',   en: 'Little brother', id: 'Adik laki',     emoji: '🧒' },
        { hanzi: '妹妹', pinyin: 'mèi mei', en: 'Little sister',  id: 'Adik perempuan', emoji: '👶' },
        { hanzi: '老师', pinyin: 'lǎo shī', en: 'Teacher',        id: 'Guru',          emoji: '🧑‍🏫' },
        { hanzi: '朋友', pinyin: 'péng you', en: 'Friend',        id: 'Teman',         emoji: '🧑‍🤝‍🧑' }
      ]
    },

    /* 7 ─ School ──────────────────────────────────────────────────────── */
    {
      id: 'school',
      name: 'School',
      icon: '🎒',
      color: '#5C6BC0',
      words: [
        { hanzi: '书',   pinyin: 'shū',     en: 'Book',      id: 'Buku',      emoji: '📕' },
        { hanzi: '笔',   pinyin: 'bǐ',      en: 'Pen',       id: 'Pena',      emoji: '✏️' },
        { hanzi: '本子', pinyin: 'běn zi',  en: 'Notebook',  id: 'Buku tulis', emoji: '📓' },
        { hanzi: '书包', pinyin: 'shū bāo', en: 'Schoolbag', id: 'Tas',       emoji: '🎒' },
        { hanzi: '椅子', pinyin: 'yǐ zi',   en: 'Chair',     id: 'Kursi',     emoji: '🪑' },
        { hanzi: '桌子', pinyin: 'zhuō zi', en: 'Desk',      id: 'Meja',      emoji: '' },
        { hanzi: '黑板', pinyin: 'hēi bǎn', en: 'Board',     id: 'Papan tulis', emoji: '🟩' },
        { hanzi: '教室', pinyin: 'jiào shì', en: 'Classroom', id: 'Kelas',    emoji: '🏫' },
        { hanzi: '老师', pinyin: 'lǎo shī', en: 'Teacher',   id: 'Guru',      emoji: '🧑‍🏫' },
        { hanzi: '学生', pinyin: 'xué shēng', en: 'Student', id: 'Murid',     emoji: '🧑‍🎓' }
      ]
    },

    /* 8 ─ Body ────────────────────────────────────────────────────────── */
    {
      id: 'body',
      name: 'Body',
      icon: '🖐️',
      color: '#26A69A',
      words: [
        { hanzi: '头',   pinyin: 'tóu',     en: 'Head',   id: 'Kepala',  emoji: '' },
        { hanzi: '眼睛', pinyin: 'yǎn jing', en: 'Eyes',  id: 'Mata',    emoji: '👀' },
        { hanzi: '鼻子', pinyin: 'bí zi',   en: 'Nose',   id: 'Hidung',  emoji: '👃' },
        { hanzi: '嘴',   pinyin: 'zuǐ',     en: 'Mouth',  id: 'Mulut',   emoji: '👄' },
        { hanzi: '耳朵', pinyin: 'ěr duo',  en: 'Ears',   id: 'Telinga', emoji: '👂' },
        { hanzi: '手',   pinyin: 'shǒu',    en: 'Hand',   id: 'Tangan',  emoji: '✋' },
        { hanzi: '脚',   pinyin: 'jiǎo',    en: 'Foot',   id: 'Kaki',    emoji: '🦶' },
        { hanzi: '肚子', pinyin: 'dù zi',   en: 'Tummy',  id: 'Perut',   emoji: '🫃' },
        { hanzi: '背',   pinyin: 'bèi',     en: 'Back',   id: 'Punggung', emoji: '' },
        { hanzi: '心',   pinyin: 'xīn',     en: 'Heart',  id: 'Hati',    emoji: '❤️' }
      ]
    },

    /* 9 ─ Weather ─────────────────────────────────────────────────────── */
    {
      id: 'weather',
      name: 'Weather',
      icon: '🌦️',
      color: '#29B6F6',
      words: [
        { hanzi: '晴天', pinyin: 'qíng tiān', en: 'Sunny',   id: 'Cerah',  emoji: '☀️' },
        { hanzi: '下雨', pinyin: 'xià yǔ',    en: 'Raining', id: 'Hujan',  emoji: '🌧️' },
        { hanzi: '下雪', pinyin: 'xià xuě',   en: 'Snowing', id: 'Salju',  emoji: '🌨️' },
        { hanzi: '云',   pinyin: 'yún',       en: 'Cloud',   id: 'Awan',   emoji: '☁️' },
        { hanzi: '风',   pinyin: 'fēng',      en: 'Wind',    id: 'Angin',  emoji: '🌬️' },
        { hanzi: '热',   pinyin: 'rè',        en: 'Hot',     id: 'Panas',  emoji: '🥵' },
        { hanzi: '冷',   pinyin: 'lěng',      en: 'Cold',    id: 'Dingin', emoji: '🥶' },
        { hanzi: '温暖', pinyin: 'wēn nuǎn',  en: 'Warm',    id: 'Hangat', emoji: '♨️' },
        { hanzi: '雷',   pinyin: 'léi',       en: 'Thunder', id: 'Petir',  emoji: '⚡' },
        { hanzi: '彩虹', pinyin: 'cǎi hóng',  en: 'Rainbow', id: 'Pelangi', emoji: '🌈' }
      ]
    },

    /* 10 ─ People & Me ────────────────────────────────────────────────── */
    {
      id: 'people',
      name: 'People & Me',
      icon: '🙋',
      color: '#FFA726',
      words: [
        { hanzi: '我',   pinyin: 'wǒ',       en: 'I / Me',   id: 'Saya',           emoji: '🙋' },
        { hanzi: '你',   pinyin: 'nǐ',       en: 'You',      id: 'Kamu',           emoji: '👉' },
        { hanzi: '他',   pinyin: 'tā',       en: 'He',       id: 'Dia (laki)',     emoji: '👦' },
        { hanzi: '她',   pinyin: 'tā',       en: 'She',      id: 'Dia (perempuan)', emoji: '👧' },
        { hanzi: '我们', pinyin: 'wǒ men',   en: 'We',       id: 'Kami',           emoji: '👨‍👩‍👧' },
        { hanzi: '人',   pinyin: 'rén',      en: 'Person',   id: 'Orang',          emoji: '🧑' },
        { hanzi: '男孩', pinyin: 'nán hái',  en: 'Boy',      id: 'Anak laki-laki', emoji: '👦' },
        { hanzi: '女孩', pinyin: 'nǚ hái',   en: 'Girl',     id: 'Anak perempuan', emoji: '👧' },
        { hanzi: '名字', pinyin: 'míng zi',  en: 'Name',     id: 'Nama',           emoji: '🏷️' },
        { hanzi: '大家', pinyin: 'dà jiā',   en: 'Everyone', id: 'Semua orang',    emoji: '👥' }
      ]
    },

    /* 11 ─ Actions ───────────────────────────────────────────────────── */
    {
      id: 'actions',
      name: 'Actions',
      icon: '🏃',
      color: '#26C6DA',
      words: [
        { hanzi: '吃',   pinyin: 'chī',       en: 'Eat',    id: 'Makan',  emoji: '🍽️' },
        { hanzi: '喝',   pinyin: 'hē',        en: 'Drink',  id: 'Minum',  emoji: '🥤' },
        { hanzi: '看',   pinyin: 'kàn',       en: 'Look',   id: 'Lihat',  emoji: '👀' },
        { hanzi: '听',   pinyin: 'tīng',      en: 'Listen', id: 'Dengar', emoji: '👂' },
        { hanzi: '说',   pinyin: 'shuō',      en: 'Speak',  id: 'Bicara', emoji: '🗣️' },
        { hanzi: '读',   pinyin: 'dú',        en: 'Read',   id: 'Baca',   emoji: '📖' },
        { hanzi: '写',   pinyin: 'xiě',       en: 'Write',  id: 'Tulis',  emoji: '✍️' },
        { hanzi: '走',   pinyin: 'zǒu',       en: 'Walk',   id: 'Jalan',  emoji: '🚶' },
        { hanzi: '跑',   pinyin: 'pǎo',       en: 'Run',    id: 'Lari',   emoji: '🏃' },
        { hanzi: '跳',   pinyin: 'tiào',      en: 'Jump',   id: 'Lompat', emoji: '🤸' },
        { hanzi: '坐',   pinyin: 'zuò',       en: 'Sit',    id: 'Duduk',  emoji: '🪑' },
        { hanzi: '睡觉', pinyin: 'shuì jiào', en: 'Sleep',  id: 'Tidur',  emoji: '😴' }
      ]
    },

    /* 12 ─ Time ──────────────────────────────────────────────────────── */
    {
      id: 'time',
      name: 'Time',
      icon: '⏰',
      color: '#7E57C2',
      words: [
        { hanzi: '今天', pinyin: 'jīn tiān',  en: 'Today',     id: 'Hari ini',  emoji: '📅' },
        { hanzi: '明天', pinyin: 'míng tiān', en: 'Tomorrow',  id: 'Besok',     emoji: '⏭️' },
        { hanzi: '昨天', pinyin: 'zuó tiān',  en: 'Yesterday', id: 'Kemarin',   emoji: '⏮️' },
        { hanzi: '现在', pinyin: 'xiàn zài',  en: 'Now',       id: 'Sekarang',  emoji: '⏰' },
        { hanzi: '早上', pinyin: 'zǎo shang', en: 'Morning',   id: 'Pagi',      emoji: '🌅' },
        { hanzi: '晚上', pinyin: 'wǎn shang', en: 'Evening',   id: 'Malam',     emoji: '🌙' },
        { hanzi: '中午', pinyin: 'zhōng wǔ',  en: 'Noon',      id: 'Siang',     emoji: '🌞' },
        { hanzi: '星期', pinyin: 'xīng qī',   en: 'Week',      id: 'Minggu',    emoji: '🗓️' },
        { hanzi: '年',   pinyin: 'nián',      en: 'Year',      id: 'Tahun',     emoji: '🎍' },
        { hanzi: '月',   pinyin: 'yuè',       en: 'Month',     id: 'Bulan',     emoji: '📆' },
        { hanzi: '小时', pinyin: 'xiǎo shí',  en: 'Hour',      id: 'Jam',       emoji: '⏳' },
        { hanzi: '分钟', pinyin: 'fēn zhōng', en: 'Minute',    id: 'Menit',     emoji: '⏱️' }
      ]
    },

    /* 13 ─ Transport ─────────────────────────────────────────────────── */
    {
      id: 'transport',
      name: 'Transport',
      icon: '🚗',
      color: '#EF6C00',
      words: [
        { hanzi: '车',     pinyin: 'chē',          en: 'Car',       id: 'Mobil',  emoji: '🚗' },
        { hanzi: '飞机',   pinyin: 'fēi jī',       en: 'Airplane',  id: 'Pesawat', emoji: '✈️' },
        { hanzi: '火车',   pinyin: 'huǒ chē',      en: 'Train',     id: 'Kereta', emoji: '🚆' },
        { hanzi: '出租车', pinyin: 'chū zū chē',   en: 'Taxi',      id: 'Taksi',  emoji: '🚕' },
        { hanzi: '自行车', pinyin: 'zì xíng chē',  en: 'Bicycle',   id: 'Sepeda', emoji: '🚲' },
        { hanzi: '公共汽车', pinyin: 'gōng gòng qì chē', en: 'Bus', id: 'Bus',    emoji: '🚌' },
        { hanzi: '船',     pinyin: 'chuán',        en: 'Boat',      id: 'Kapal',  emoji: '🚢' },
        { hanzi: '地铁',   pinyin: 'dì tiě',       en: 'Subway',    id: 'MRT',    emoji: '🚇' }
      ]
    },

    /* 14 ─ Describe ──────────────────────────────────────────────────── */
    {
      id: 'describe',
      name: 'Describe',
      icon: '📏',
      color: '#9CCC65',
      words: [
        { hanzi: '大',   pinyin: 'dà',         en: 'Big',    id: 'Besar',   emoji: '🐘' },
        { hanzi: '小',   pinyin: 'xiǎo',       en: 'Small',  id: 'Kecil',   emoji: '🐭' },
        { hanzi: '多',   pinyin: 'duō',        en: 'Many',   id: 'Banyak',  emoji: '➕' },
        { hanzi: '少',   pinyin: 'shǎo',       en: 'Few',    id: 'Sedikit', emoji: '➖' },
        { hanzi: '高',   pinyin: 'gāo',        en: 'Tall',   id: 'Tinggi',  emoji: '⬆️' },
        { hanzi: '长',   pinyin: 'cháng',      en: 'Long',   id: 'Panjang', emoji: '📏' },
        { hanzi: '新',   pinyin: 'xīn',        en: 'New',    id: 'Baru',    emoji: '✨' },
        { hanzi: '旧',   pinyin: 'jiù',        en: 'Old',    id: 'Lama',    emoji: '📦' },
        { hanzi: '漂亮', pinyin: 'piào liang', en: 'Pretty', id: 'Cantik',  emoji: '💅' },
        { hanzi: '快',   pinyin: 'kuài',       en: 'Fast',   id: 'Cepat',   emoji: '⚡' },
        { hanzi: '慢',   pinyin: 'màn',        en: 'Slow',   id: 'Lambat',  emoji: '🐌' },
        { hanzi: '好',   pinyin: 'hǎo',        en: 'Good',   id: 'Bagus',   emoji: '👍' }
      ]
    },

    /* 15 ─ Question Words ────────────────────────────────────────────── */
    {
      id: 'questions',
      name: 'Question Words',
      icon: '❓',
      color: '#FFB300',
      words: [
        { hanzi: '什么',     pinyin: 'shén me',        en: 'What',      id: 'Apa',        emoji: '❓' },
        { hanzi: '谁',       pinyin: 'shéi',           en: 'Who',       id: 'Siapa',      emoji: '🙋' },
        { hanzi: '哪里',     pinyin: 'nǎ lǐ',          en: 'Where',     id: 'Di mana',    emoji: '📍' },
        { hanzi: '为什么',   pinyin: 'wèi shén me',    en: 'Why',       id: 'Kenapa',     emoji: '🤔' },
        { hanzi: '怎么',     pinyin: 'zěn me',         en: 'How',       id: 'Bagaimana',  emoji: '🔧' },
        { hanzi: '什么时候', pinyin: 'shén me shí hou', en: 'When',     id: 'Kapan',      emoji: '⏰' },
        { hanzi: '多少',     pinyin: 'duō shao',       en: 'How many',  id: 'Berapa',     emoji: '🔢' },
        { hanzi: '哪个',     pinyin: 'nǎ ge',          en: 'Which one', id: 'Yang mana',  emoji: '👆' },
        { hanzi: '可以吗',   pinyin: 'kě yǐ ma',       en: 'May I?',    id: 'Boleh?',     emoji: '🙏' },
        { hanzi: '好吗',     pinyin: 'hǎo ma',         en: 'Is that OK?', id: 'Oke?',     emoji: '👌' }
      ]
    },

    /* 16 ─ Feelings ──────────────────────────────────────────────────── */
    {
      id: 'feelings',
      name: 'Feelings',
      icon: '😊',
      color: '#F06292',
      words: [
        { hanzi: '开心', pinyin: 'kāi xīn',   en: 'Happy',   id: 'Senang',  emoji: '😄' },
        { hanzi: '难过', pinyin: 'nán guò',   en: 'Sad',     id: 'Sedih',   emoji: '😢' },
        { hanzi: '生气', pinyin: 'shēng qì',  en: 'Angry',   id: 'Marah',   emoji: '😠' },
        { hanzi: '累',   pinyin: 'lèi',       en: 'Tired',   id: 'Lelah',   emoji: '😪' },
        { hanzi: '害怕', pinyin: 'hài pà',    en: 'Scared',  id: 'Takut',   emoji: '😨' },
        { hanzi: '紧张', pinyin: 'jǐn zhāng', en: 'Nervous', id: 'Gugup',   emoji: '😬' },
        { hanzi: '兴奋', pinyin: 'xīng fèn',  en: 'Excited', id: 'Semangat', emoji: '🤩' },
        { hanzi: '无聊', pinyin: 'wú liáo',   en: 'Bored',   id: 'Bosan',   emoji: '😑' },
        { hanzi: '饿',   pinyin: 'è',         en: 'Hungry',  id: 'Lapar',   emoji: '🤤' },
        { hanzi: '渴',   pinyin: 'kě',        en: 'Thirsty', id: 'Haus',    emoji: '🥤' }
      ]
    },

    /* 17 ─ Places ────────────────────────────────────────────────────── */
    {
      id: 'places',
      name: 'Places',
      icon: '📍',
      color: '#8D6E63',
      words: [
        { hanzi: '家',     pinyin: 'jiā',        en: 'Home',       id: 'Rumah',         emoji: '🏠' },
        { hanzi: '学校',   pinyin: 'xué xiào',   en: 'School',     id: 'Sekolah',       emoji: '🏫' },
        { hanzi: '公园',   pinyin: 'gōng yuán',  en: 'Park',       id: 'Taman',         emoji: '🌳' },
        { hanzi: '商店',   pinyin: 'shāng diàn', en: 'Store',      id: 'Toko',          emoji: '🏪' },
        { hanzi: '医院',   pinyin: 'yī yuàn',    en: 'Hospital',   id: 'Rumah sakit',   emoji: '🏥' },
        { hanzi: '图书馆', pinyin: 'tú shū guǎn', en: 'Library',   id: 'Perpustakaan',  emoji: '📚' },
        { hanzi: '餐厅',   pinyin: 'cān tīng',   en: 'Restaurant', id: 'Restoran',      emoji: '🍽️' },
        { hanzi: '厕所',   pinyin: 'cè suǒ',     en: 'Toilet',     id: 'Toilet',        emoji: '🚽' },
        { hanzi: '操场',   pinyin: 'cāo chǎng',  en: 'Playground', id: 'Lapangan',      emoji: '🛝' },
        { hanzi: '房间',   pinyin: 'fáng jiān',  en: 'Room',       id: 'Kamar',         emoji: '🚪' }
      ]
    },

    /* 18 ─ Hobbies & Sports ──────────────────────────────────────────── */
    {
      id: 'hobbies',
      name: 'Hobbies & Sports',
      icon: '⚽',
      color: '#00BCD4',
      words: [
        { hanzi: '足球',   pinyin: 'zú qiú',       en: 'Soccer',     id: 'Sepak bola', emoji: '⚽' },
        { hanzi: '篮球',   pinyin: 'lán qiú',      en: 'Basketball', id: 'Basket',     emoji: '🏀' },
        { hanzi: '游泳',   pinyin: 'yóu yǒng',     en: 'Swim',       id: 'Berenang',   emoji: '🏊' },
        { hanzi: '画画',   pinyin: 'huà huà',      en: 'Draw',       id: 'Menggambar', emoji: '🎨' },
        { hanzi: '唱歌',   pinyin: 'chàng gē',     en: 'Sing',       id: 'Bernyanyi',  emoji: '🎤' },
        { hanzi: '跳舞',   pinyin: 'tiào wǔ',      en: 'Dance',      id: 'Menari',     emoji: '💃' },
        { hanzi: '骑车',   pinyin: 'qí chē',       en: 'Ride a bike', id: 'Bersepeda', emoji: '🚴' },
        { hanzi: '弹钢琴', pinyin: 'tán gāng qín', en: 'Play piano', id: 'Main piano', emoji: '🎹' },
        { hanzi: '打游戏', pinyin: 'dǎ yóu xì',    en: 'Play games', id: 'Main game',  emoji: '🎮' },
        { hanzi: '踢球',   pinyin: 'tī qiú',       en: 'Kick ball',  id: 'Menendang bola', emoji: '🦵' }
      ]
    },

    /* 19 ─ Household Objects ─────────────────────────────────────────── */
    {
      id: 'household',
      name: 'Household Objects',
      icon: '🏠',
      color: '#78909C',
      words: [
        { hanzi: '床',   pinyin: 'chuáng',    en: 'Bed',      id: 'Tempat tidur', emoji: '🛏️' },
        { hanzi: '电视', pinyin: 'diàn shì',  en: 'TV',       id: 'Televisi',     emoji: '📺' },
        { hanzi: '冰箱', pinyin: 'bīng xiāng', en: 'Fridge',  id: 'Kulkas',       emoji: '🧊' },
        { hanzi: '门',   pinyin: 'mén',       en: 'Door',     id: 'Pintu',        emoji: '🚪' },
        { hanzi: '窗户', pinyin: 'chuāng hu', en: 'Window',   id: 'Jendela',      emoji: '🪟' },
        { hanzi: '灯',   pinyin: 'dēng',      en: 'Lamp',     id: 'Lampu',        emoji: '💡' },
        { hanzi: '厨房', pinyin: 'chú fáng',  en: 'Kitchen',  id: 'Dapur',        emoji: '🍳' },
        { hanzi: '沙发', pinyin: 'shā fā',    en: 'Sofa',     id: 'Sofa',         emoji: '🛋️' },
        { hanzi: '手机', pinyin: 'shǒu jī',   en: 'Phone',    id: 'HP',           emoji: '📱' },
        { hanzi: '电脑', pinyin: 'diàn nǎo',  en: 'Computer', id: 'Komputer',     emoji: '💻' },
        { hanzi: '玩具', pinyin: 'wán jù',    en: 'Toy',      id: 'Mainan',       emoji: '🧸' },
        { hanzi: '钱',   pinyin: 'qián',      en: 'Money',    id: 'Uang',         emoji: '💰' }
      ]
    }
  ],

  /* ─ Sentence Builder set (Susun Kalimat) ─────────────────────────────
     Each card is one token. Tokens are shown shuffled; correct order = array.
     Kept short (3–4 tokens) and kid-friendly, reusing known vocabulary.    */
  sentences: [
    { tokens: ['我', '叫', 'Matthew'], pinyin: 'wǒ jiào Matthew', en: 'My name is Matthew' },
    { tokens: ['你', '好', '吗'],       pinyin: 'nǐ hǎo ma',       en: 'How are you?' },
    { tokens: ['谢谢', '你'],           pinyin: 'xiè xie nǐ',      en: 'Thank you' },
    { tokens: ['这', '是', '苹果'],     pinyin: 'zhè shì píng guǒ', en: 'This is an apple' },
    { tokens: ['我', '喜欢', '狗'],     pinyin: 'wǒ xǐ huan gǒu',  en: 'I like dogs' },
    { tokens: ['我', '爱', '妈妈'],     pinyin: 'wǒ ài mā ma',     en: 'I love Mom' },
    { tokens: ['我', '是', '学生'],     pinyin: 'wǒ shì xué shēng', en: 'I am a student' },
    { tokens: ['妈妈', '喝', '水'],     pinyin: 'mā ma hē shuǐ',   en: 'Mom drinks water' },
    { tokens: ['今天', '很', '热'],     pinyin: 'jīn tiān hěn rè', en: 'Today is hot' },
    { tokens: ['猫', '是', '黑色'],     pinyin: 'māo shì hēi sè',  en: 'The cat is black' },
    { tokens: ['我', '吃', '饭'],       pinyin: 'wǒ chī fàn',      en: 'I eat rice' },
    { tokens: ['他', '喝', '茶'],       pinyin: 'tā hē chá',       en: 'He drinks tea' },
    { tokens: ['我', '坐', '车'],       pinyin: 'wǒ zuò chē',      en: 'I ride in a car' },
    { tokens: ['你', '叫', '什么', '名字'], pinyin: 'nǐ jiào shén me míng zi', en: "What's your name?" },
    { tokens: ['你', '几岁', '了'],     pinyin: 'nǐ jǐ suì le',    en: 'How old are you?' },
    { tokens: ['你', '在', '哪里'],     pinyin: 'nǐ zài nǎ lǐ',    en: 'Where are you?' },
    { tokens: ['现在', '几点', '了'],   pinyin: 'xiàn zài jǐ diǎn le', en: 'What time is it now?' },
    { tokens: ['我', '很', '开心'],     pinyin: 'wǒ hěn kāi xīn',  en: 'I am happy' },
    { tokens: ['我', '有点', '累'],     pinyin: 'wǒ yǒu diǎn lèi', en: 'I am a bit tired' },
    { tokens: ['我', '饿', '了'],       pinyin: 'wǒ è le',         en: "I'm hungry" },
    { tokens: ['我', '喜欢', '游泳'],   pinyin: 'wǒ xǐ huan yóu yǒng', en: 'I like swimming' },
    { tokens: ['我', '想', '去', '公园'], pinyin: 'wǒ xiǎng qù gōng yuán', en: 'I want to go to the park' },
    { tokens: ['我', '可以', '喝', '水', '吗'], pinyin: 'wǒ kě yǐ hē shuǐ ma', en: 'May I drink water?' },
    { tokens: ['这', '是', '我', '的', '书包'], pinyin: 'zhè shì wǒ de shū bāo', en: 'This is my schoolbag' },
    { tokens: ['猫', '在', '沙发', '上'], pinyin: 'māo zài shā fā shang', en: 'The cat is on the sofa' },
    { tokens: ['我', '在', '家', '看', '电视'], pinyin: 'wǒ zài jiā kàn diàn shì', en: 'I watch TV at home' },
    { tokens: ['妈妈', '在', '厨房'],   pinyin: 'mā ma zài chú fáng', en: 'Mom is in the kitchen' },
    { tokens: ['弟弟', '在', '玩', '玩具'], pinyin: 'dì di zài wán wán jù', en: 'Little brother is playing with toys' }
  ],

  /* ─ Dragon mascot phrases (English, kid-friendly) ────────────────────── */
  phrases: {
    correct: ['Awesome! 🎉', 'You got it! ⭐', 'Super!', 'Great job! 🐉', 'Perfect! 💯', 'Wow!'],
    wrong:   ['Try again! 💪', 'Almost!', "You can do it!", 'Keep going! 🔄', 'Oops, try once more!'],
    idle:    ["Let's learn Chinese!", 'Tap a topic to play!', 'Ready, Matthew?', 'You are a star! ⭐'],
    win:     ['You did it! 🎉', 'Dragon is proud! 🐉', 'Amazing work!', 'You are so smart!'],
    speak:   ['Say it out loud! 🎤', 'I am listening...', 'Speak clearly!']
  }
};

/* Helper: flat list of every word (used by some modes for distractors). */
MANDO_DATA.allWords = MANDO_DATA.categories.reduce(
  (acc, c) => acc.concat(c.words.map(w => ({ ...w, cat: c.id }))), []
);

/* Quick lookup of a category by id. */
MANDO_DATA.getCategory = function (id) {
  return MANDO_DATA.categories.find(c => c.id === id);
};
