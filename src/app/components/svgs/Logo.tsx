import React from 'react';

const Logo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  const { className, width = 40, height = 40, ...rest } = props;

  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 3000 3000'
      className={className} 
      width={width}
      height={height}
      {...rest}
    >
      <title>Celestia Logo</title>
      <path
        fill="#d4145a" 
        d="M1472.64,250.53s-138.56-81.07-357.77-13.84c-225.48,69.16-365.43,198.51-438.4,387.87-362.67,941.06,1024.7,1984.68,1817.88,1390.06,482.56-361.76,152-1141.82-506.86-796.71-117.2,61.39-593.95,356.27-623.14,357.86,130.38-174.02,286.01-331.32,413.87-507.17,171.69-236.13,261.74-466.28,7.5-691.55,11.36-17.38,88.97-14.96,124.98-10.46,77.35,9.67,127.07,42.96,219.25,51.07,119.91,10.55,261.77,4.3,377.53-28.5,84.96-24.07,157.9-82.69,252.55-66.27-23.34,56.48-62.18,103.53-86.33,160.42-154.56,364.07,35.19,525.13,172.75,831.4,597.32,1329.94-831.85,2069.59-1945.68,1394.08-111.4-67.56-154.23-165.66-298.1-94.35-107.74,53.4-436.34,275.73-465.62,274.63l310.99-453.56c57.91-124.2-73-228.25-135.5-330.5C-111.17,1411.88-171.92,411.08,703.85,92.93c384.18-139.57,690.7,7.02,768.78,157.6Z"
      />
    </svg>
  );
};

export default Logo;

