export function getTimeUntilNumberAssignment(gameDate: string): {
  isReady: boolean;
  timeRemaining: string;
  minutesRemaining: number;
} {
  const gameTime = new Date(gameDate).getTime();
  const currentTime = new Date().getTime();
  const tenMinutesInMs = 10 * 60 * 1000;
  const assignmentTime = gameTime - tenMinutesInMs;
  const timeDifference = assignmentTime - currentTime;

  if (timeDifference <= 0) {
    return {
      isReady: true,
      timeRemaining: 'Ready now',
      minutesRemaining: 0
    };
  }

  const hours = Math.floor(timeDifference / (1000 * 60 * 60));
  const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

  let timeString = '';
  if (hours > 0) {
    timeString += `${hours}h `;
  }
  if (minutes > 0 || hours > 0) {
    timeString += `${minutes}m `;
  }
  timeString += `${seconds}s`;

  return {
    isReady: false,
    timeRemaining: timeString,
    minutesRemaining: Math.ceil(timeDifference / (1000 * 60))
  };
}

export function formatGameDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}