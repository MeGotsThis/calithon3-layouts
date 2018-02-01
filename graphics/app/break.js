(function() {
  'use strict';

  const BACKGROUND_DURATION = 300000;

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
      img: 'img/backgrounds/SF Bay.png',
      text: 'San Francisco Bay, CA',
    },
    {
      img: 'img/backgrounds/Hotel Del Coronado.png',
      text: 'Hotel Del Coronado, CA',
    },
    {
      img: 'img/backgrounds/Camino de la Costa.png',
      text: 'Camina de la Costa, CA',
    },
  ];

  let backgroundIndex = -1;

  const getRandomInt = (max) => {
    return Math.floor(Math.random() * Math.floor(max));
  };

  const randomBackground = () => {
    let index = getRandomInt(backgrounds.length);
    while (index == backgroundIndex) {
      index = getRandomInt(backgrounds.length);
    }

    backgroundIndex = index;
    let background = backgrounds[index];

    document.getElementById('background-image').src = background.img;
    document.getElementById('scenery').style.backgroundImage =
      `url('${background.img}')`;
    document.getElementById('location-text').innerHTML = background.text;
  };

  setTimeout(randomBackground, BACKGROUND_DURATION);
  randomBackground();

  window.addEventListener('DOMContentLoaded', () => {
    TweenLite.to(document.body, 0.333, {
      opacity: 1,
      ease: Power1.easeOut,
    });
  });
})();
