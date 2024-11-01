export function getTimeDifference(startDate: Date, endDate: Date): string {
    // Calculate the difference in milliseconds
    const differenceInMilliseconds = endDate.getTime() - startDate.getTime();
    
    // Convert milliseconds to seconds
    const differenceInSeconds = differenceInMilliseconds / 1000;
    
    // Check if the difference is less than 60 seconds
    if (differenceInSeconds < 60) {
      return `${differenceInSeconds.toFixed(2)} seconds`;
    } else {
      // Convert seconds to minutes
      const differenceInMinutes = differenceInSeconds / 60;
      return `${differenceInMinutes.toFixed(2)} minutes`;
    }
  } 