/* ===========================================================================
   MandoQuest — data.js
   All learning content: 14 categories (155 words) + sentence builder set.
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
    { tokens: ['我', '坐', '车'],       pinyin: 'wǒ zuò chē',      en: 'I ride in a car' }
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
