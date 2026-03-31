Clinical Trials: Geospatial Search & GridFS Image Management System
Group: Dr. Data

DESCRIPTION:
This application allows users to search for clinical trials by keyword and geographic
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


VOLUME:
After loading the data, we ran the countDocuments() command across all collections

Collection name: studies
Result of countDocuments():

Collection name: images.files
Result of countDocuments():

Collection name: images.chunks
Result of countDocuments():

Collection name: system.indexes
Result of countDocuments(): 3


VARIETY:
To see the capabilities of the application, try searching the following terms:
      - Cancer
      - Rochester 
      - 

HOW TO USE:
1) Connect to the RLES VM and open the project in VS Code to access the environment.
2) In the backend and frontend terminals, run the start command
3) Open Firefox within the VM, and paste the local link



