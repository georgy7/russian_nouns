// Generated by CoffeeScript 1.10.0

/*
Copyright (c) 2011-2016 Устинов Георгий Михайлович

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */

(function() {
  var RussianNouns, StemUtil, consonantsExceptJ, decline, decline1, decline3, declineAsList, getDeclension, initial, isVowel, last, lastN, misc, vowels;

  window.Case = {
    NOMINATIVE: "Именительный",
    GENITIVE: "Родительный",
    DATIVE: "Дательный",
    ACCUSATIVE: "Винительный",
    INSTRUMENTAL: "Творительный",
    PREPOSITIONAL: "Предложный"
  };

  window.Declension = {
    0: 'разносклоняемые "путь" и "дитя"',
    1: 'муж., средний род без окончания',
    2: 'слова на "а", "я" (м., ж. и общий род)',
    3: 'жен. род без окончания, слова на "мя"'
  };

  window.Gender = {
    "FEMININE": "женский род",
    "MASCULINE": "мужской род",
    "NEUTER": "средний род",
    "COMMON": "общий род"
  };


  /*
  interface Vocabulary
    lemmas:(word) -> Array<Lemma>
  
  interface Lemma
    text:() -> String                 # Слово в именительном падеже ед.ч.
    isPluraliaTantum:() -> Boolean
    isIndeclinable:() -> Boolean
    isAnimate:() -> Boolean
    isSurname:() -> Boolean
    gender:() -> Gender
  
  window.RussianNouns = 
     * Возвращает список, т.к. бывают "вторые" родительный, винительный и предложный падежи.
     * Также, сущ. ж. р. в творительном могут иметь как окончания -ей -ой, так и -ею -ою.
    decline: (lemma, grammaticalCase) -> [String]
   */

  RussianNouns = (function() {
    function RussianNouns() {}

    RussianNouns.prototype.getDeclension = function(lemma) {
      return getDeclension(lemma);
    };

    RussianNouns.prototype.decline = function(lemma, grammaticalCase) {
      return declineAsList(lemma, grammaticalCase);
    };

    return RussianNouns;

  })();

  window.RussianNouns = RussianNouns;

  misc = {
    requiredString: function(v) {
      if (typeof v !== "string") {
        throw new Error(v + " is not a string.");
      }
    }
  };

  consonantsExceptJ = ['б', 'в', 'г', 'д', 'ж', 'з', 'к', 'л', 'м', 'н', 'п', 'р', 'с', 'т', 'ф', 'х', 'ц', 'ч', 'ш', 'щ'];

  vowels = ['а', 'о', 'у', 'э', 'ы', 'я', 'ё', 'ю', 'е', 'и'];

  isVowel = function(character) {
    return _.contains(vowels, character);
  };

  last = function(str) {
    return _.last(str);
  };

  lastN = function(str, n) {
    return str.substring(str.length - n);
  };

  initial = function(s) {
    if (s.length <= 1) {
      return '';
    }
    return s.substring(0, s.length - 1);
  };

  StemUtil = {

    /** Доп. проверки для стеммера */
    getNounStem: function(word) {
      var lastChar;
      lastChar = last(word);
      if (_.contains(consonantsExceptJ, lastChar)) {
        return word;
      }
      if ('ь' === lastChar) {
        return initial(word);
      }
      if ('ь' === last(initial(word))) {
        return initial(word);
      }
      if ('о' === lastChar && _.contains(['л', 'м', 'н', 'т', 'х', 'в', 'с'], last(initial(word)))) {
        return initial(word);
      }
      return StemUtil.getStem(word);
    },

    /** Русский стеммер из Snowball JavaScript Library. */
    getStem: function(word) {
      var c;
      c = last(word);
      if (('й' === c || isVowel(c)) && isVowel(last(initial(word)))) {
        return initial(initial(word));
      }
      if (isVowel(c)) {
        return initial(word);
      }
      return word;
    },
    getInit: function(s) {
      return initial(s);
    },
    getLastTwoChars: function(s) {
      if (s.length <= 1) {
        return '';
      }
      return s.substring(s.length - 2, s.length);
    }
  };


  /** 
  Определяет склонение существительных
  @param word слово в именительном падеже
  @param gender пол
  @returns {integer} склонение (см. Declension)
   */

  getDeclension = function(lemma) {
    var gender, t, word;
    word = lemma.text();
    gender = lemma.gender();
    misc.requiredString(word);
    misc.requiredString(gender);
    if (lemma.isIndeclinable()) {
      return -1;
    }
    t = last(word);
    switch (gender) {
      case Gender.FEMININE:
        return t == "а" || t == "я" ? 2 : 3;
      case Gender.MASCULINE:
        return t == "а" || t == "я" ? 2 :
      word == "путь" ? 0 : 1;
      case Gender.NEUTER:
        return word == "дитя" ? 0 :
      StemUtil.getLastTwoChars(word) == "мя" ? 3 : 1;
      case Gender.COMMON:
        if (t === 'а' || t === 'я') {
          return 2;
        } else if (t === 'и') {
          return -1;
        } else {
          return 1;
        }
        break;
      default:
        throw new Error("incorrect gender");
    }
  };

  decline1 = function(lemma, grCase) {
    var a, checkWord, gender, head, iyWord, okWord, schWord, soft, stem, surnameType1, tsStem, tsWord, word;
    word = lemma.text();
    gender = lemma.gender();
    stem = StemUtil.getNounStem(word);
    head = initial(word);
    soft = function() {
      var lastChar;
      lastChar = last(word);
      return lastChar === 'ь' || lastChar === 'е';
    };
    iyWord = function() {
      return last(word) === 'й' || _.contains(['ий', 'ие'], StemUtil.getLastTwoChars(word));
    };
    schWord = function() {
      return _.contains(['ч', 'щ'], last(stem));
    };
    tsWord = function() {
      return last(word) === 'ц';
    };
    checkWord = function() {
      return word.endsWith('чек') && word.length >= 6;
    };
    okWord = function() {
      return checkWord() || (word.endsWith('ок') && !word.endsWith('шок') && !isVowel(word[word.length - 3]) && isVowel(word[word.length - 4]) && word.length >= 4);
    };
    tsStem = function() {
      if ('а' === word[word.length - 2]) {
        return head;
      } else if (lastN(head, 2) === 'ле') {
        return initial(head) + 'ь';
      } else if (isVowel(word[word.length - 2])) {
        if (isVowel(word[word.length - 3])) {
          return word.substring(0, word.length - 2) + 'й';
        } else {
          return word.substring(0, word.length - 2);
        }
      } else {
        return word.substring(0, word.length - 1);
      }
    };
    surnameType1 = function() {
      return lemma.isSurname() && (word.endsWith('ин') || word.endsWith('ов') || word.endsWith('ев'));
    };
    switch (grCase) {
      case Case.NOMINATIVE:
        return word;
      case Case.GENITIVE:
        if (iyWord() && lemma.isSurname()) {
          return stem + 'ого';
        } else if (iyWord()) {
          return head + 'я';
        } else if (soft() && !schWord()) {
          return stem + 'я';
        } else if (tsWord()) {
          return tsStem() + 'ца';
        } else if (okWord()) {
          return word.substring(0, word.length - 2) + 'ка';
        } else {
          return stem + 'а';
        }
        break;
      case Case.DATIVE:
        if (iyWord() && lemma.isSurname()) {
          return stem + 'ому';
        } else if (iyWord()) {
          return head + 'ю';
        } else if (soft() && !schWord()) {
          return stem + 'ю';
        } else if (tsWord()) {
          return tsStem() + 'цу';
        } else if (okWord()) {
          return word.substring(0, word.length - 2) + 'ку';
        } else {
          return stem + 'у';
        }
        break;
      case Case.ACCUSATIVE:
        if (gender === Gender.NEUTER) {
          return word;
        } else {
          a = lemma.isAnimate();
          if (a === true || a === null) {
            return decline1(lemma, Case.GENITIVE);
          } else {
            return word;
          }
        }
        break;
      case Case.INSTRUMENTAL:
        if (iyWord() && lemma.isSurname()) {
          return stem + 'им';
        } else if (iyWord()) {
          return head + 'ем';
        } else if (soft() || _.contains(['ж', 'ч', 'ш'], last(stem))) {
          return stem + 'ем';
        } else if (tsWord()) {
          return tsStem() + 'цем';
        } else if (okWord()) {
          return word.substring(0, word.length - 2) + 'ком';
        } else if (surnameType1()) {
          return word + 'ым';
        } else {
          return stem + 'ом';
        }
        break;
      case Case.PREPOSITIONAL:
        if (iyWord() && lemma.isSurname()) {
          return stem + 'ом';
        } else if (_.contains(['ий', 'ие'], StemUtil.getLastTwoChars(word))) {
          return head + 'и';
        } else if (last(word) === 'й') {
          return head + 'е';
        } else if (tsWord()) {
          return tsStem() + 'це';
        } else if (okWord()) {
          return word.substring(0, word.length - 2) + 'ке';
        } else {
          return stem + 'е';
        }
    }
  };

  decline3 = function(word, grCase) {
    var stem;
    stem = StemUtil.getNounStem(word);
    if (StemUtil.getLastTwoChars(word) === 'мя') {
      switch (grCase) {
        case Case.NOMINATIVE:
          return word;
        case Case.GENITIVE:
          return stem + 'ени';
        case Case.DATIVE:
          return stem + 'ени';
        case Case.ACCUSATIVE:
          return word;
        case Case.INSTRUMENTAL:
          return stem + 'енем';
        case Case.PREPOSITIONAL:
          return stem + 'ени';
      }
    } else {
      switch (grCase) {
        case Case.NOMINATIVE:
          return word;
        case Case.GENITIVE:
          return stem + 'и';
        case Case.DATIVE:
          return stem + 'и';
        case Case.ACCUSATIVE:
          return word;
        case Case.INSTRUMENTAL:
          return stem + 'ью';
        case Case.PREPOSITIONAL:
          return stem + 'и';
      }
    }
  };

  declineAsList = function(lemma, grCase) {
    var r;
    r = decline(lemma, grCase);
    if (r instanceof Array) {
      return r;
    }
    return [r];
  };

  decline = function(lemma, grCase) {
    var ayaWord, declension, gender, head, soft, stem, surnameLike, word;
    word = lemma.text();
    gender = lemma.gender();
    stem = StemUtil.getNounStem(word);
    head = StemUtil.getInit(word);
    if (lemma.isIndeclinable()) {
      return word;
    }
    if (lemma.isPluraliaTantum()) {
      throw "PluraliaTantum words are unsupported.";
    }
    declension = getDeclension(lemma);
    switch (declension) {
      case -1:
        return word;
      case 0:
        if (word === 'путь') {
          if (grCase === Case.INSTRUMENTAL) {
            return 'путем';
          } else {
            return decline3(word, grCase);
          }
        } else {
          throw new Error("unsupported");
        }
        break;
      case 1:
        return decline1(lemma, grCase);
      case 2:
        soft = function() {
          var lastChar;
          lastChar = last(word);
          return lastChar === 'я';
        };
        surnameLike = function() {
          return word.endsWith('ова') || word.endsWith('ева') || (word.endsWith('ина') && !word.endsWith('стина'));
        };
        ayaWord = function() {
          return word.endsWith('ая') && !((word.length < 3) || isVowel(last(stem)));
        };
        switch (grCase) {
          case Case.NOMINATIVE:
            return word;
          case Case.GENITIVE:
            if (ayaWord()) {
              return stem + 'ой';
            } else if (lemma.isSurname()) {
              return head + 'ой';
            } else if (soft() || _.contains(['ч', 'ж', 'ш', 'щ', 'г', 'к', 'х'], last(stem))) {
              return head + 'и';
            } else {
              return head + 'ы';
            }
            break;
          case Case.DATIVE:
            if (ayaWord()) {
              return stem + 'ой';
            } else if (lemma.isSurname()) {
              return head + 'ой';
            } else if (StemUtil.getLastTwoChars(word) === 'ия') {
              return head + 'и';
            } else {
              return head + 'е';
            }
            break;
          case Case.ACCUSATIVE:
            if (ayaWord()) {
              return stem + 'ую';
            } else if (soft()) {
              return head + 'ю';
            } else {
              return head + 'у';
            }
            break;
          case Case.INSTRUMENTAL:
            if (ayaWord()) {
              return stem + 'ой';
            } else if (soft() || _.contains(['ц', 'ч', 'ж', 'ш', 'щ'], last(stem))) {
              return [head + 'ей', head + 'ею'];
            } else {
              return [head + 'ой', head + 'ою'];
            }
            break;
          case Case.PREPOSITIONAL:
            if (ayaWord()) {
              return stem + 'ой';
            } else if (lemma.isSurname()) {
              return head + 'ой';
            } else if (StemUtil.getLastTwoChars(word) === 'ия') {
              return head + 'и';
            } else {
              return head + 'е';
            }
        }
        break;
      case 3:
        return decline3(word, grCase);
    }
  };

}).call(this);
