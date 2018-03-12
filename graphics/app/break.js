(function() {
  'use strict';

  const BACKGROUND_DURATION = 300000;

  const camera = nodecg.Replicant('break-cam');
  const total = nodecg.Replicant('total');

  const backgrounds = [
    {
      img: 'img/backgrounds/Catalina Island.png',
      text: 'Santa Catalina Island, CA',
    },
    {
      img: 'img/backgrounds/La Jolla.png',
      text: 'La Jolla, CA',
    },
    {
      img: 'img/backgrounds/Yosemite Valley.png',
      text: 'Yosemite National Park, CA',
    },
    {
      img: 'img/backgrounds/Calaveras Big Trees.png',
      text: 'Calaveras Big Trees State Park, CA',
    },
    {
      img: 'img/backgrounds/Oceanside Pier View.png',
      text: 'Oceanside Pier, CA',
    },
    {
      img: 'img/backgrounds/SF Bay.jpg',
      text: 'San Francisco Bay, CA',
    },
    {
      img: 'img/backgrounds/Hotel Del Coronado.png',
      text: 'Hotel Del Coronado, CA',
    },
    {
      img: 'img/backgrounds/Camina de la Costa.png',
      text: 'Camina de la Costa, CA',
    },
  ];

  let backgroundIndex = -1;

  camera.on('change', (value) => {
    document.getElementById('scenery').hidden = value;
  });

  total.on('change', (newVal, oldVal) => {
    if (oldVal
        && newVal.raw >= CALITHON_TOTAL
        && oldVal.raw < CALITHON_TOTAL) {
      alertNewRecord();
    }
  });

  const alertNewRecord = () => {
    const donate = document.getElementById('donate');
    const record = document.getElementById('record');
    const text = document.getElementById('record-text');
    const tl = new TimelineMax({
    });
    tl.set(donate, {
      display: 'none',
    });
    tl.set(record, {
      display: 'block',
    });
    tl.add(TweenMax.fromTo(text, 1, {
      opacity: 0,
    }, {
      repeat: 30,
      opacity: 1,
      yoyo: true,
      repeatDelay: 0.5,
    }).totalDuration(30));
    tl.set(donate, {
      display: 'block',
    });
    tl.set(record, {
      display: 'none',
    });
  };

  const getRandomInt = (max) => {
    return Math.floor(Math.random() * Math.floor(max));
  };

  const randomBackground = (delay = 100) => {
    let index = getRandomInt(backgrounds.length);
    while (index == backgroundIndex) {
      index = getRandomInt(backgrounds.length);
    }

    backgroundIndex = index;
    let background = backgrounds[index];

    document.getElementById('background-load').style.backgroundImage =
      `url('${background.img}')`;
    setTimeout(() => {
      document.getElementById('background-image').style.backgroundImage =
        `url('${background.img}')`;
      document.getElementById('scenery').style.backgroundImage =
        `url('${background.img}')`;
      document.getElementById('location-text').innerHTML = background.text;
    }, delay);
  };

  setTimeout(randomBackground, BACKGROUND_DURATION);
  randomBackground(0);

  window.addEventListener('DOMContentLoaded', () => {
    TweenLite.to(document.body, 0.333, {
      opacity: 1,
      ease: Power1.easeOut,
    });
  });
})();
