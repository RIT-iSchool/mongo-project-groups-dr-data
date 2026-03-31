Clinical Trials: Geospatial Search & GridFS Image Management System
Group: Dr. Data

DESCRIPTION:
This application allows users to search for clinical trials in the US by keyword and geographic
location. It utilizes MongoDB for data storage and GridFS for binary image management.

TECHNOLOGY STACK:
For this project, we used the following stack to meet the requirements
- Database: 
      - Language Used: MongoDB
      - We chose a NoSQL document database to handle the variety of clinical
      trial data. It natively supports GeoJSON for our geospatial requirements and
      GridFS for storing the images.

- Backend:
      - Language Used: Node.js with Express.js
      - This provided an ideal environment to create our API routes. It 
      allowed us to easily integrate the MongoDB driver to handle the complex
      queries and stream binary data from GridFS to the frontend. 

- Frontend:
      - Language Used: React (Vite)
      - We used Vite since it allows for a dynamic UI where the search results
      and map coordinates can update the view without a fulle page reload.

PROCESS:
To load the database, we performed the following steps:
1) Data extraction 
      - we mapped clinical trial data from clinicaltrials.gov

2) GridFS initialization
      - In the app/images/js script the bucket named 'images' is initialized. 
      As a result, the 'images.files' and 'images.chunks' collections to store 
      the binary trial images.

3) Database creation
      - We ran the app/geocode.js script to convert the trial addresses into 
      [longitude, latitude] coordinates then store them in the 'studies' collection 
      with a 2dsphere index for geospatial searching.

4) Challenges
      - Ensuring the MongoDB authentication worked across the RLES VM environment. 
      - The VM had port issues on 3000
      - VM networking issues



VOLUME:
After loading the data, we ran the countDocuments() command across all collections

Collection name: studies
Result of countDocuments(): 50707

Collection name: images.files
Result of countDocuments(): 13

Collection name: images.chunks
Result of countDocuments(): 72



BELLS AND WHISTLES:
- The application's design is appealing to the eye and easy for the users to understand. 
- Websites provides options for recommended searches



HOW TO USE:
1) Connect to the RLES VM and open the project in VS Code to access the environment.
2) The IP address for the VM is 172.16.0.66
3) In the backend terminal use the command line 'node server.js'
4) In the frontend terminal, use the command line 'npm run dev'
5) Open Firefox within the VM, and paste the local link



