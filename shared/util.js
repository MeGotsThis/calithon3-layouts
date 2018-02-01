const formatTimeSpan = (timeSpan, {hours = false} = {}) => {
  if (typeof timeSpan === 'undefined') {
    return undefined;
  }

  const parts = [];
  let hour = Math.floor(timeSpan / 3600);
  let minute = Math.floor(timeSpan % 3600 / 60);
  let second = timeSpan % 3600;
  if (hours || hour) {
    parts.push(hour + '');
  }
  if (minute < 10) {
    parts.push('0' + minute);
  } else {
    parts.push(minute + '');
  }
  if (second < 10) {
    parts.push('0' + second);
  } else {
    parts.push(second + '');
  }
  return parts.join(':');
};

const parseTimeSpan = (timeSpan) => {
  const parts = timeSpan.split(':');
  if (parts.length == 3) {
    return (parseInt(parts[0]) * 3600
      + parseInt(parts[1]) * 60
      + parseInt(parts[2]));
  }
  if (parts.length == 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  if (parts.length == 1) {
    return parseInt(parts[0]);
  }
  return 0;
};
