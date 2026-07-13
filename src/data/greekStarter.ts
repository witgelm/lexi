export interface PresetEntry {
  front: string
  back: string
  transcription?: string
  example?: string
}

export interface PresetDeck {
  title: string
  langFrom: string
  langTo: string
  words: PresetEntry[]
}

/**
 * Top-100 high-frequency Greek words with Latin transcription and Russian
 * translations. Front = Greek (the word to learn), back = Russian meaning.
 */
export const GREEK_STARTER: PresetDeck = {
  title: 'Греческий — топ-100',
  langFrom: 'el',
  langTo: 'ru',
  words: [
    // Приветствия и вежливость
    { front: 'γεια', back: 'привет', transcription: 'ya' },
    { front: 'καλημέρα', back: 'доброе утро', transcription: 'kaliméra' },
    { front: 'καλησπέρα', back: 'добрый вечер', transcription: 'kalispéra' },
    { front: 'καληνύχτα', back: 'спокойной ночи', transcription: 'kaliníhta' },
    { front: 'αντίο', back: 'до свидания', transcription: 'adío' },
    { front: 'ευχαριστώ', back: 'спасибо', transcription: 'efharistó' },
    { front: 'παρακαλώ', back: 'пожалуйста', transcription: 'parakaló' },
    { front: 'ναι', back: 'да', transcription: 'ne' },
    { front: 'όχι', back: 'нет', transcription: 'óhi' },
    { front: 'συγγνώμη', back: 'извините', transcription: 'signómi' },
    { front: 'εντάξει', back: 'хорошо, ок', transcription: 'endáksi' },
    { front: 'καλά', back: 'хорошо', transcription: 'kalá' },
    // Местоимения
    { front: 'εγώ', back: 'я', transcription: 'egó' },
    { front: 'εσύ', back: 'ты', transcription: 'esí' },
    { front: 'αυτός', back: 'он', transcription: 'aftós' },
    { front: 'αυτή', back: 'она', transcription: 'aftí' },
    { front: 'εμείς', back: 'мы', transcription: 'emís' },
    { front: 'εσείς', back: 'вы', transcription: 'esís' },
    { front: 'αυτοί', back: 'они', transcription: 'aftí' },
    // Вопросы
    { front: 'τι', back: 'что', transcription: 'ti' },
    { front: 'ποιος', back: 'кто', transcription: 'piós' },
    { front: 'πού', back: 'где', transcription: 'pu' },
    { front: 'πότε', back: 'когда', transcription: 'póte' },
    { front: 'γιατί', back: 'почему', transcription: 'yatí' },
    { front: 'πώς', back: 'как', transcription: 'pos' },
    { front: 'πόσο', back: 'сколько', transcription: 'póso' },
    // Глаголы
    { front: 'είμαι', back: 'быть', transcription: 'íme' },
    { front: 'έχω', back: 'иметь', transcription: 'ého' },
    { front: 'θέλω', back: 'хотеть', transcription: 'thélo' },
    { front: 'ξέρω', back: 'знать', transcription: 'kséro' },
    { front: 'κάνω', back: 'делать', transcription: 'káno' },
    { front: 'πηγαίνω', back: 'идти, ехать', transcription: 'piyéno' },
    { front: 'έρχομαι', back: 'приходить', transcription: 'érhome' },
    { front: 'τρώω', back: 'есть, кушать', transcription: 'tróo' },
    { front: 'πίνω', back: 'пить', transcription: 'píno' },
    { front: 'μιλάω', back: 'говорить', transcription: 'miláo' },
    { front: 'βλέπω', back: 'видеть', transcription: 'vlépo' },
    { front: 'ακούω', back: 'слышать', transcription: 'akúo' },
    { front: 'λέω', back: 'говорить, сказать', transcription: 'léo' },
    { front: 'αγαπώ', back: 'любить', transcription: 'agapó' },
    { front: 'μπορώ', back: 'мочь', transcription: 'boró' },
    { front: 'δίνω', back: 'давать', transcription: 'díno' },
    { front: 'παίρνω', back: 'брать', transcription: 'pérno' },
    { front: 'γράφω', back: 'писать', transcription: 'gráfo' },
    { front: 'διαβάζω', back: 'читать', transcription: 'diavázo' },
    // Люди и семья
    { front: 'άνθρωπος', back: 'человек', transcription: 'ánthropos' },
    { front: 'άντρας', back: 'мужчина', transcription: 'ándras' },
    { front: 'γυναίκα', back: 'женщина', transcription: 'yinéka' },
    { front: 'παιδί', back: 'ребёнок', transcription: 'pedí' },
    { front: 'φίλος', back: 'друг', transcription: 'fílos' },
    { front: 'μητέρα', back: 'мать', transcription: 'mitéra' },
    { front: 'πατέρας', back: 'отец', transcription: 'patéras' },
    { front: 'οικογένεια', back: 'семья', transcription: 'ikoyénia' },
    // Еда и напитки
    { front: 'νερό', back: 'вода', transcription: 'neró', example: 'Θέλω ένα ποτήρι νερό' },
    { front: 'ψωμί', back: 'хлеб', transcription: 'psomí' },
    { front: 'καφές', back: 'кофе', transcription: 'kafés', example: 'Ένας καφές, παρακαλώ' },
    { front: 'κρασί', back: 'вино', transcription: 'krasí' },
    { front: 'γάλα', back: 'молоко', transcription: 'gála' },
    { front: 'φαγητό', back: 'еда', transcription: 'fayitó' },
    { front: 'φρούτο', back: 'фрукт', transcription: 'frúto' },
    { front: 'τυρί', back: 'сыр', transcription: 'tirí' },
    // Места
    { front: 'σπίτι', back: 'дом', transcription: 'spíti', example: 'Το σπίτι μου είναι μεγάλο' },
    { front: 'πόλη', back: 'город', transcription: 'póli' },
    { front: 'δρόμος', back: 'улица, дорога', transcription: 'drómos' },
    { front: 'θάλασσα', back: 'море', transcription: 'thálasa' },
    { front: 'αγορά', back: 'рынок', transcription: 'agorá' },
    { front: 'δουλειά', back: 'работа', transcription: 'duliá' },
    { front: 'σχολείο', back: 'школа', transcription: 'sholío' },
    // Время
    { front: 'μέρα', back: 'день', transcription: 'méra' },
    { front: 'νύχτα', back: 'ночь', transcription: 'níhta' },
    { front: 'πρωί', back: 'утро', transcription: 'proí' },
    { front: 'βράδυ', back: 'вечер', transcription: 'vrádi' },
    { front: 'ώρα', back: 'час, время', transcription: 'óra' },
    { front: 'χρόνος', back: 'год, время', transcription: 'hrónos' },
    { front: 'σήμερα', back: 'сегодня', transcription: 'símera' },
    { front: 'αύριο', back: 'завтра', transcription: 'ávrio' },
    { front: 'χθες', back: 'вчера', transcription: 'hthes' },
    { front: 'τώρα', back: 'сейчас', transcription: 'tóra' },
    // Прилагательные
    { front: 'μεγάλος', back: 'большой', transcription: 'megálos' },
    { front: 'μικρός', back: 'маленький', transcription: 'mikrós' },
    { front: 'καλός', back: 'хороший', transcription: 'kalós' },
    { front: 'κακός', back: 'плохой', transcription: 'kakós' },
    { front: 'νέος', back: 'новый, молодой', transcription: 'néos' },
    { front: 'ωραίος', back: 'красивый', transcription: 'oréos' },
    { front: 'πολύς', back: 'много', transcription: 'polís' },
    { front: 'λίγος', back: 'мало', transcription: 'lígos' },
    // Числа
    { front: 'ένα', back: 'один', transcription: 'éna' },
    { front: 'δύο', back: 'два', transcription: 'dío' },
    { front: 'τρία', back: 'три', transcription: 'tría' },
    { front: 'τέσσερα', back: 'четыре', transcription: 'tésera' },
    { front: 'πέντε', back: 'пять', transcription: 'pénde' },
    { front: 'έξι', back: 'шесть', transcription: 'éksi' },
    { front: 'εφτά', back: 'семь', transcription: 'eftá' },
    { front: 'οκτώ', back: 'восемь', transcription: 'októ' },
    { front: 'εννέα', back: 'девять', transcription: 'enéa' },
    { front: 'δέκα', back: 'десять', transcription: 'déka' },
    // Разное полезное
    { front: 'όνομα', back: 'имя', transcription: 'ónoma' },
    { front: 'γλώσσα', back: 'язык', transcription: 'glósa' },
    { front: 'λέξη', back: 'слово', transcription: 'léksi' },
    { front: 'βιβλίο', back: 'книга', transcription: 'vivlío' },
  ],
}
