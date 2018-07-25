'use strict';

const groupBy = require('lodash.groupby');
const mean = require('ml-array-mean');

const { loadData, applyModel } = require('../src/svm');
const filterMAD = require('../src/util/filterOutliersMAD');

async function exec() {
  const dirA = './data/esc-v2-all';
  const dirB = './data/bidif-2';

  const dataA = await loadData(dirA);
  const dataB = await loadData(dirB);

  const cardsA = groupBy(dataA, (data) => data.card);
  const cardsB = groupBy(dataB, (data) => data.card);

  const featuresA = await getFeatures(cardsA);
  const featuresB = await getFeatures(cardsB);

  console.log(featuresA);
  console.log(featuresB);
}

async function getFeatures(cards) {
  const features = [];
  for (let cardKey in cards) {
    let card = cards[cardKey];
    // console.log(cardKey);
    const Xtest = card.map((d) => d.descriptor);
    const pred = await applyModel('ESC-v2', Xtest);
    // console.log('length bef', card.length);
    // Filter < char for they can be smaller in some fonts
    card = card.filter((c, idx) => pred[idx] !== 60);
    // only keep first two lines (not clear why it helps but it does)
    card = card.filter((c) => c.line !== 2);

    // console.log('length after filter', card.length);
    // console.log(card.length);
    // console.log(card.map((c) => c.image.height));
    // console.log('length before MAD filtering', card.length);
    card = filterMAD(
      card,
      2.5,
      (card) => card.image.height + Math.random() * 0.01
    );
    // console.log('length after MAD filtering', card.length);
    const grouped = groupBy(card, (c) => {
      const code = c.char.charCodeAt(0);
      if (code >= 38 && code <= 57) {
        return 'number';
      } else if (code >= 65 && code <= 90) {
        return 'letter';
      } else {
        return 'other';
      }
    });

    grouped.letter = grouped.letter || [];
    grouped.number = grouped.number || [];
    // console.log('number of numbers', grouped.number.length);
    // console.log('number of letters', grouped.letter.length);
    // console.log('other', grouped.other ? grouped.other.length : 0);
    const metric =
      mean(grouped.number.map((c) => c.image.height)) /
      mean(grouped.letter.map((c) => c.image.height));
    console.log(cardKey, metric);
    features.push(metric);
    // console.log(card.map((c) => ({ height: c.image.height, c: c.char })));
    // separate chars and
    // features.push([getCharHeightRatioDescriptor(card.map((c) => c.image))]);
  }
  return features;
}

exec()
  .then(console.log)
  .catch(console.log);
