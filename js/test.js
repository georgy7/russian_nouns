﻿var window = self;
importScripts('third-party/underscore.js');
importScripts('RussianNouns.js');

let inputLemmaCount;
let dataM, dataF, dataN, dataC;
let workerIndex, letterIndex;

let main = function () {

    let cases = RussianNouns.caseList();

    let wrongCases = 0;
    let wrongWordsSingular = 0;
    let correctWordsWithWarningsSingular = 0;
    let totalCases = 0;
    let totalWords = 0;
    const totalLoadingSteps = 5;
    const result = [];

    let pluralizeTotal = 0;
    let pluralizeWrong = 0;

    function ojejojuejuStatus(expected, actual, grCase) {

        if (grCase !== RussianNouns.cases().INSTRUMENTAL) {
            return;
        }

        const all = [
            'ой', 'ей',
            'ою', 'ею'		// This is a literary norm of the 19th century.
        ];

        const suExpected = _.uniq(expected).sort();
        const suActual = _.uniq(actual).sort();


        // --------- Utility functions --------------

        function tooShort(word) {
            return word.length < 3;
        }

        function getEnding(word) {
            return word.substring(word.length - 2);
        }

        function getStem(word) {
            return word.substring(0, word.length - 2)
        }

        function wordMatches(word) {
            return all.includes(getEnding(word));
        }

        // -----------------------------------------

        if (suExpected.find(tooShort) || suActual.find(tooShort)) {
            return;
        }

        if (suExpected.find(w => !wordMatches(w)) || suActual.find(w => !wordMatches(w))) {
            return;
        }

        let uniqExpStems = _.uniq(suExpected.map(getStem));
        let uniqActualStems = _.uniq(suActual.map(getStem));

        let expectedVowels = _.uniq(suExpected.map(getEnding).map(_.first)).sort();
        let actualVowels = _.uniq(suActual.map(getEnding).map(_.first)).sort();

        if ((uniqExpStems.length === 1)
            && (uniqActualStems.length === 1)
            && (uniqExpStems[0] === uniqActualStems[0])
            && (expectedVowels.length === 1)
            && (actualVowels.length === 1)
            && (expectedVowels[0] === actualVowels[0])) {

            if (_.isEqual(suExpected, suActual)
                || ((uniqExpStems[0].length >= 3) && suExpected.every(w => suActual.includes(w)))) {
                return 'valid';
            } else {
                return 'doubtful';
            }
        }
    }

    function test(data, gender, loadingStepCompleted) {

        for (let i = 0; i < data.length; i++) {

            if ((i % 250 == 0) || (i == (data.length - 1))) {
                var stepWidth = 1 / totalLoadingSteps;
                var loadStatus = stepWidth * (loadingStepCompleted + ((1 + i) / data.length));
                postMessage({
                    type: 'loading',
                    status: loadStatus,
                    workerIndex: workerIndex,
                    letterIndex: letterIndex
                });
            }

            const word = data[i].cases[0][0]; // Именительный падеж
            const expResults = data[i].cases;

            if (data[i].g.indexOf('Pltm') >= 0) {
                continue; // PluraliaTantum is unsupported.
            }

            const animate = (data[i].g.indexOf('anim') >= 0);
            const fixed = (data[i].g.indexOf('Fixd') >= 0);
            const surname = (data[i].g.indexOf('Surn') >= 0);

            const lemma = RussianNouns.createLemma({
                text: word,
                gender: gender,
                animate: animate,
                surname: surname,
                indeclinable: fixed,
                pluraliaTantum: false
            });

            const lemmaUpperCase = lemma.clone();
            lemmaUpperCase.nominativeSingular = lemma.text().toUpperCase();

            const resultWordForms = [];
            totalWords++;
            totalCases += 6;

            let wordIsWrongSingular = false;
            let wordHasWarningSingular = false;

            for (let j = 0; j <= 6; j++) {

                const c = cases[j];
                const expected = expResults[j];

                let actual;

                try {
                    actual = RussianNouns.decline(lemma, c);

                    const actualUpperCase = RussianNouns.decline(lemmaUpperCase, c);
                    const aString = actual.toString().toLowerCase();
                    const auString = actualUpperCase.toString().toLowerCase();

                    if (aString !== auString) {
                        throw `Different upper-case result: ${word}, gender: ${gender}, case: ${c}, "${aString} !== ${auString}".`
                    }

                } catch (e) {
                    actual = ['-----'];
                    if (e.message !== "unsupported") {
                        throw e;
                    } else {
                        console.log(`Unsupported: "${word}"`);
                    }
                }

                const sameCount = (_.uniq(actual).length == _.uniq(expected).length);
                const everyExpectedIsInActual = expected.every(function (e) {
                    return actual.indexOf(e) >= 0;
                });
                const actualWithoutYo = actual.map(function (word) {
                    return word.toLowerCase().replace(/ё/g, 'е');
                });
                const exactMatchIgnoringYo = sameCount && expected.every(function (word) {
                    var yoLess = word.toLowerCase().replace(/ё/g, 'е');
                    return actualWithoutYo.indexOf(yoLess) >= 0;
                });
                const exactMatchIgnoringNjeNjiAndYo = sameCount && (1 === actual.length) && (function () {
                    const yoLess = expected[0].toLowerCase().replace(/ё/g, 'е');
                    const actualYoLess = actual[0].toLowerCase().replace(/ё/g, 'е');
                    if (!(yoLess.endsWith('нье') || yoLess.endsWith('ньи'))) {
                        return false;
                    }
                    if (!(actualYoLess.endsWith('нье') || actualYoLess.endsWith('ньи'))) {
                        return false;
                    }
                    return yoLess.substring(0, yoLess.length - 3) === actualYoLess.substring(0, actualYoLess.length - 3);
                })();

                let warning = false;
                let ok, failure;
                if ((everyExpectedIsInActual && sameCount) || ('valid' === ojejojuejuStatus(expected, actual, c))) {
                    ok = true;
                    failure = false;
                } else if (('doubtful' === ojejojuejuStatus(expected, actual, c))
                    || (RussianNouns.cases().GENITIVE === c && actual[0] === expected[0])
                    || (
                        [RussianNouns.cases().PREPOSITIONAL, RussianNouns.cases().LOCATIVE].includes(c)
                        && gender == RussianNouns.genders().NEUTER
                        && word.endsWith('нье')
                        && exactMatchIgnoringNjeNjiAndYo
                    )
                    || exactMatchIgnoringYo) {
                    ok = false;
                    failure = false;
                    warning = true;
                    wordHasWarningSingular = true;
                } else {
                    ok = false;
                    failure = true;
                    wrongCases++;
                    wordIsWrongSingular = true;
                }
                resultWordForms.push({
                    "expected": expected.join(', '),
                    "actual": actual.join(', '),
                    "ok": ok,
                    "failure": failure,
                    "warning": warning,
                    "failureOrWarning": (failure || warning)
                });
            }

            if (wordIsWrongSingular) {
                wrongWordsSingular++;
            } else if (wordHasWarningSingular) {
                correctWordsWithWarningsSingular++;
            }

            let declension = '';
            try {
                declension = RussianNouns.getDeclension(lemma);
            } catch (e) {
            }

            let expectedCasesPlural = data[i].casesPlural;

            const resultPluralForms = [];

            resultPluralForms[0] = {
                "expected": expectedCasesPlural[0].join(', ')
            };

            if (expectedCasesPlural[0].length > 0) {
                pluralizeTotal++;

                const r = resultPluralForms[0];

                const actualPluralNominative = RussianNouns.pluralize(lemma);

                const pluralUpperCase = RussianNouns.pluralize(lemmaUpperCase);
                const aString = actualPluralNominative.toString().toLowerCase();
                const auString = pluralUpperCase.toString().toLowerCase();

                if (aString !== auString) {
                    throw `Different upper-case plurals: ${word}, gender: ${lemma.gender()}, "${aString} !== ${auString}".`
                }

                r.actual = actualPluralNominative.join(', ');

                r.failure =
                    actualPluralNominative.slice().sort().toString() !==
                    expectedCasesPlural[0].slice().sort().toString();

                if (r.failure) {
                    pluralizeWrong++;
                } else {
                    r.warning = actualPluralNominative.toString() !== expectedCasesPlural[0].toString();
                }

                r.failureOrWarning = r.failure || r.warning;
            }

            let wordStatus;

            if (wordIsWrongSingular || resultPluralForms[0].failure) {
                wordStatus = 'wrong';
            } else if (wordHasWarningSingular || resultPluralForms[0].warning) {
                wordStatus = 'hasWarnings';
            } else {
                wordStatus = 'correct';
            }

            result.push({
                "rowNumber": (result.length + 1),
                "wordForms": resultWordForms,
                "pluralForms": resultPluralForms,
                "gender": gender,
                "declension": declension,
                "status": wordStatus
            });
        }
    }

    test(dataM, RussianNouns.genders().MASCULINE, 1);
    test(dataF, RussianNouns.genders().FEMININE, 2);
    test(dataN, RussianNouns.genders().NEUTER, 3);
    test(dataC, RussianNouns.genders().COMMON, 4);

    postMessage({
        type: 'testResult',
        workerIndex: workerIndex,
        letterIndex: letterIndex,
        totalCases: totalCases,
        wrongCases: wrongCases,
        totalWords: totalWords,
        inputWords: inputLemmaCount,
        wrongWordsSingular: wrongWordsSingular,
        correctWordsWithWarningsSingular: correctWordsWithWarningsSingular,
        pluralizeWrong: pluralizeWrong,
        pluralizeTotal: pluralizeTotal,
        resultForTemplate: {"items": result}
    });

};

onmessage = function (e) {
    if (e.data.type === 'start') {
        const wordList = e.data.words;
        workerIndex = e.data.workerIndex;
        letterIndex = e.data.letterIndex;
        postMessage({type: 'started', wordsLen: wordList.length});
        dataM = [];
        dataF = [];
        dataN = [];
        dataC = [];
        inputLemmaCount = 0;
        for (let lemmaList of wordList) {
            inputLemmaCount += lemmaList.length;
            for (let lemma of lemmaList) {
                if (lemma.g.indexOf('masc') >= 0) {
                    dataM.push(lemma);
                } else if (lemma.g.indexOf('femn') >= 0) {
                    dataF.push(lemma);
                } else if (lemma.g.indexOf('neut') >= 0) {
                    dataN.push(lemma);
                } else if (lemma.g.indexOf('ms-f') >= 0) {
                    dataC.push(lemma);
                }
            }
        }
        main();
    }
};