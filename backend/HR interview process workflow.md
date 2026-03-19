<span id=_Toch1rfv5h0t5sy>HR interview process workflow </span>  

## Introduction (Purpose and Objective) <span id=_Tock8z1bblgcdup></span>  
### Purpose <span id=_Tocgt2ezgvspglf></span>  
To build an AI-powered interview evaluation system where HR can:   
* Screen resumes automatically   
* Conduct structured multi-round interviews   
* Generate transcripts from interview recordings   
* Receive standardized evaluation scores   
* Make data-driven hiring decisions   
The system now operates in  **4 Stages** :   
* **_Resume Screening (AI Pre-Filter – Not a Stage )_**   
* **_Stage 1 – HR Screening Round_**   
* **_Stage 2 – Technical Practical Round_**   
* **_Stage 3 – Technical + HR Panel Evaluation_**   
* **_Stage 4 – CTO Interview (Only for Senior Positions)_**   
### Objective <span id=_Tocdcmrw9iyl1ev></span>  
Automate and standardize candidate evaluation by:   
* Transcribing interview recordings (Zoom/Teams/Call recordings)   
* Extracting insights from candidate responses   
* Structuring evaluation criteria   
* Generating round-wise decision recommendations   
* Providing objective hiring support metrics   
* Maintaining a centralized candidate database   
  ## Problem Statements <span id=_Tockftu1lzudz26></span>  
* Manual resume screening is time-consuming.   
* Interview analysis depends heavily on human judgment.   
* No standardized scoring system for candidate-job fit.   
* Difficult to compare multiple candidates objectively.   
* HR spends excessive time shortlisting candidates.   
  
## Goals <span id=_Toc39fsxwiy4ako></span>  
* Eliminates resume screening bias   
* Saves 60–70% HR effort   
* Structured 3-stage evaluation   
* Round-wise decision gating   
* Behavioral + Technical AI scoring   
* Centralized candidate intelligence database   
* Data-driven final hiring decision   
##   
## Proposed Solution <span id=_Tocgt08vzbll5tv></span>  
A web-based application built using:   
### Backend <span id=_Tocg9tzhpfitjxq></span>  
* Python 3.11+   
* FastAPI   
* DSPy (Prompt Optimization & Evaluation)   
* PostgreSQL   
* SQLAlchemy ORM   
###   
### AI Components <span id=_Toc38tc8x3oj44j></span>  
* Resume parser   
* Audio/Video transcription engine   
* Embedding model for semantic similarity   
* RRF (Reciprocal Rank Fusion) scoring engine   
* Attribute evaluation models   
### Frontend <span id=_Toc5vh9fzw8p4jj></span>  
* React.js   
## <span id=_Toceu9anl1yyydx>  
##   
## System Flow </span>  
### <span id=_Tocllwlwpjgwep0>Resume Screening (AI Pre-Filter) <span id=_Tocdrnqudtx7ma3></span></span>  
* HR uploads the candidate resume (PDF / DOCX).   
* The system extracts:   
	* Skills   
	* Experienc e   
	* Education   
	* Certifications   
* AI compares the resume with the  **Job Description (JD)**  and generates:   
	* Match percentage   
	* Skill gap analysis   
	* Experience alignment   
	* Strength summary   
	* Missing skills list   
	* Extraordinary points (skills not in JD but impressive)   
  
  
  
### Output <span id=_Tocgral9yj0vgud></span>  
* Resume Screening Result:   
	* **PASS**  → Candidate moves to Stage 1   
	* **FAIL**  → Candidate rejected   
* The system displays:   
* Resume score   
	* Pass / Fail decision   
	* Skill gap summary   
  
### <span id=_Toc8brq3grmastz>Stage 1 – HR Screening Round (Audio Based) <span id=_Tocfxb76s1fc5ip></span></span>  
* HR conducts the screening call.   
* Recording is uploaded:   
* **Accepted format:** ** MP3 / WAV**   
* The system performs:   
	* Audio transcription   
	* Response summarization   
	* Candidate communication analysis   
### LLM-as-a-Judge Evaluation Criteria <span id=_Tocffi29e3b2kzo></span>  
* Communication skill   
* Confidence   
* Cultural fit   
* Profile understanding   
* Tech-stack alignment   
* Salary alignment   
### Context Used <span id=_Toc5o3vayjjzbvk></span>  
* Evaluation uses:   
	* Resume data   
	* Job Description   
	* Resume screening analysis   
###   
### Output <span id=_Toc9lp1q1jijdty></span>  
* Stage 1 produces:   
	* HR screening score   
	* Response summary   
	* Communication evaluation   
	* Recommendation   
* Decision:   
	* Proceed to  **Stage 2**   
	* Reject candidate   
  
### <span id=_Tocu8wtb2uyn0or></span>Stage 2 – Technical Practical Round (Video Based) <span id=_Tocjqpj13xckiyy></span>  
* **Evaluate candidate’s ** **real-time technical implementation skills** **.**   
* Candidate performs:   
	* Coding task   
	* System design explanation   
	*  Practical implementation   
* Recording uploaded:   
	* **Format:**  MP4 (preferred)   
* The system extracts:   
	* Audio transcription   
	* Technical keywords   
	* Code explanation context   
### LLM-as-a-Judge Evaluation Criteria <span id=_Toc4kgnhkvf64ru></span>  
* Problem-solving ability   
* Logical thinking   
* Code structure clarity   
* Debugging approach   
* Practical implementation accuracy   
* Explanation clarity   
* Confidence while demonstrating   
### Context Used <span id=_Tocaes9kprkv87s></span>  
* Evaluation considers:   
	* Resume data   
	* Resume screening analysis   
	* Stage 1 HR screening transcript   
	* Job Description   
### Output <span id=_Tocpaoze554ztkh></span>  
* Practical performance score   
* Technical competency rating   
* Strength summary   
* Weakness summary   
* Recommendation for Stage 3   
###   
### <span id=_Tocf5zel7elqrjh>Stage 3 – Technical + HR Panel Evaluation <span id=_Toctjtk3b5vjoj7></span></span>  
* A panel interview is conducted.   
* Recording uploaded:   
* **Format:**  MP3 / WAV   
* The system:   
	* Transcribes the interview   
	* Extracts behavioral insights   
	* Evaluates candidate attributes   
### LLM-as-a-Judge Evaluation Criteria <span id=_Tocnt7f1u5dkj5f></span>  
* Ethics & Confidence   
* Technical Skills   
* Skill articulation   
* Detail-oriented thinking   
* Attitude & behavior   
* Smartness (problem solving ability)   
* Positivity   
* Professionalism   
* Ability to take challenges   
### Context Used <span id=_Tocbhp0d8js3w3v></span>  
* The evaluation engine uses the  **complete candidate context** **:**   
	* Resume   
	* Resume screening result   
	* Stage 1 transcript & scores   
	* Stage 2 technical evaluation   
	* Job Description   
### Output <span id=_Toc9aoc476hztjs></span>  
* Attribute-wise scores:   
	* Technical score   
	* Behavioral score   
* Overall match percentage   
* Additional outputs:   
	* Strength summary   
	* Weakness summary   
	* Hiring recommendation   
Results are displayed on the  **HR dashboard** .   
### <span id=_Toc8oangmuzfydl>Stage 4 – CTO Interview (Senior Positions Only) <span id=_Tocfyqvyckrket0></span> (phase 2) </span>  
* For senior roles, the candidate proceeds to the  **CTO interview round** .   
* This stage focuses on:   
	* Strategic thinking   
	* System architecture ability   
	* Leadership capability   
	* Ownership mindset   
### Context Used <span id=_Toc60l2dyadkn8y></span>  
* The CTO evaluation uses  **all previous stages as context** :   
	* Resume   
	* Resume s creening result   
	* Stage 1 HR screening   
	* Stage 2 practical round   
	* Stage 3 panel evaluation   
	* Job Description   
### Output <span id=_Tocpuz9wzrm2gkm></span>  
* Leadership score   
* Strategic thinking evaluation   
* Final recommendation   
  
  
## <span id=_Toc97eyve74920x>Application / Website Architecture <span id=_Tocasiwrhkon7ud></span></span>  
### <span id=_Tocl1xiiojl7ceb>High-Level Architecture <span id=_Tocew1i7jgy9ni1></span></span>  
1. HR (Frontend UI)   
2. FastAPI Backend   
3. DSPy P rocessing Layer   
4. AI Scoring Engine (LLM-as-Judge)   
5. PostgreSQL Database   
6. Results returned to UI Dashboard   
## Application Workflow <span id=_Tocly0we67sbrg8></span>  
1. HR Login   
2. View Job Openings   
3. Upload Resume   
4. AI Resume Screening   
5. Resume Result (PASS / FAIL)   
6. Upload Stage 1 Interview Recording   
7. Audio → Transcription   
8. HR Decision (Proceed / Reject)   
9. Upload Stage 2 Practical Video   
10. AI Technical Evaluation   
11. Upload Stage 3 Panel Recording   
12. AI Final Evaluation   
13. Dashboard visualization   
14. Download Candidate Evaluation Report   
  
### <span id=_Tocfbly6090tnt2>User Journey Diagram (Textual Representation) <span id=_Tocqs2dkbnobqjv></span></span>  
## Role 1 – HR <span id=_Toccwtobfejorlb></span>  
* Login   
* Check Job Opening   
* Upload Resume   
* Review Resume Score (Pass / Fail)   
* Upload Stage 1 Recording   
* View Stage 1 Summary   
* Upload Stage 2 Practical Video   
* View Practical Score   
* Upload Stage 3 Recording   
* View Final Score   
* Download Candidate Report   
  
### Role 2: Admin <span id=_Tocsxje4huy0lzj></span>  
* **_Manage HR Users_**   
* **_Manage System Settings_**   
* **_View Analytics_**   
* **_Monitor Interview Data_**   
* **_Access Hiring Reports_**   
  
  
  
  
## <span id=_Toc25rpe0aaafgh>Swimlane Diagram (Process Flow) <span id=_Toc7ebhpac2vc1l></span></span>  
HR \| FastAPI \| DSPy \| AI Engine \| Database   
Upload Resume  → Validate  → Store  → Extract Text   
Compare with JD  → Matching Model  → Score Generated  → Store   
Upload Stage 1 Audio  → Transcription  → Transcript Stored   
HR Decision  → Status Update   
Upload Stage 2 Video  → Transcription  → Technical Attribute Evaluation   
Resume + Transcript + JD  → AI Matching Engine   
Score Generated  → Store  → Display on UI   
  
  
  
  
## <span id=_Tocus6y6019nif1>Modules and Pages </span>  
### 1\. Login Page <span id=_Toc5sga6rg115xy></span>  
* Email   
* Password   
* Forgot Password   
### 2\. Dashboard <span id=_Tocy8oc6mh059g6></span>  
* **_Total Candidates_**   
* **_Resume Screening Status_**   
* **_Stage 1 Pending_**   
* **_Stage 2 Pending_**   
* **_Stage 3 Pending_**   
* **_Average Match %_**   
* **_Recent Uploads_**   
  
### 3\. Candidate Upload Page <span id=_Tocel4wsj8hh1m3></span>  
* Select Job Opening   
* Upload Resume   
* Upload Stage 1 Recording   
* Upload Stage 2 Video   
* Upload Stage 3 Recording   
* Submit   
  
### 4\. Result Page <span id=_Toc8w5wdwqa0z8b></span>  
* Resume Match %   
* Stage 1 Transcript   
* Stage 1 Decision   
* Stage 2 Practical Score   
* Stage 3 Transcript   
* Attribute Scores   
* Technical Score   
* Behavioral Score   
* Final Match %   
* Strengths   
* Weaknesses   
* Final Recommendation   
Validation Rules:   
* Resume: PDF/DOCX only   
* Audio: WAV/MP3 only   
* Max file size limit   
* Required fields are mandatory   
## <span id=_Toch3doo64i0qs0></span>  
## <span id=_Toc19ziedp6kif0>Dynamic Interview Stages Configuration <span id=_Toc56wfkowaa22o></span></span>  
* **Although the system defines a ** **standard interview evaluation flow** **, the interview stages are ** **not fixed** **. The platform supports ** **dynamic stage configuration** **, where the number and type of interview stages can ** **increase or decrease depending on the job designation and Job Description (JD)** **.**   
* **This flexibility ensures that the hiring process is ** **aligned with the complexity and responsibility of the role** **.**   
  
### <span id=_Tocchufz6nhukge>Standard Reference Flow <span id=_Toc5seyad4u5mon></span></span>  
* The system provides a default structure:   
	* Resume Screening (AI Pre-Filter – Not a Stage)   
	* Stage 1 – HR Screening Round   
	* Stage 2 – Technical Practical Round   
	* Stage 3 – Technical + HR Panel Evaluation   
	* Stage 4 – CTO Interview (Senior Positions Only)   
* **However, this is only a ** **reference workflow** **.**   
  
  
### <span id=_Toc9902huy5uzi5>Dynamic Stage Adjustment <span id=_Toccdj9din7u7ka></span></span>  
* The system dynamically adjusts stages based on:   
* Job designation   
* Job Description complexity   
* Required experience level   
* Technical depth of the role   
* Organizational hiring policy   
* There will be templates for stages   
  
### <span id=_Tocth459f78ppb1>Example Stage Configurations <span id=_Toc2bdnd0cqhl9w></span></span>  
**Entry-Mid Level Role (0–3 Years Experience)** <span id=_Tocpwmr422jbb2u></span>  
* Resume Screening   
* Stage 1 – HR Screening   
* Stage 2 – Technical Practical Round   
* Stage 3 – Technical Panel Interview   
* Stage 4 – HR Final Evaluation   
* Total Stages:  **4**   
  
**Senior Role (6+ Years Experience)** <span id=_Tocrwvp0w420k7r></span>  
* Resume Screening   
* Stage 1 – HR Screening   
* Stage 2 – Technical Practical Round   
* Stage 3 – Technical Panel Interview   
* Stage 4 – Leadership / Architecture Discussion   
* Stage 5 – CTO Interview   
* Total Stages:  **5**   
  
## <span id=_Toc0zmh9f6ml1y4>QA Tools <span id=_Tocg8s0mwdlpati></span></span>  
* Pytest (Unit testing)   
* Postman (API testing)   
  
## <span id=_Toczv86ckafbmzp>Error Handling & Logging <span id=_Tocmqeopm88t4uh></span></span>  
* Fast api error handlers   
* Structured logging (logging module)   
* Store AI errors separately   
* Retry mechanism for transcription failures   
  
## <span id=_Tocr020ym9ut7is>Performance Strategy <span id=_Tocw6fx8irgtwlb></span></span>  
### <span id=_Toc57isdnf1lcmn>Caching <span id=_Tocrwseewkikxqw></span></span>  
* Redis for frequently accessed job embedding   
* Cache similarity results   
### <span id=_Toc1yt4kq6qy195>Optimization <span id=_Toco9be056uv66k></span></span>  
* Batch embedding generation   
* Asynchronous transcription   
* Lazy load candidate results   
  
## <span id=_Tocjczlr2scb21f>Additional points  </span>  
* Maintain github repository and share with us.   
* Use postgres SQL as database    
* Follow structured version control and deployment practices.   
* Ensure data security and role-based access control.   
  
    
  
