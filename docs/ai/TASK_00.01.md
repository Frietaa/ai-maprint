\# MABA PRINTING — EXECUTION TASK 00.01



\## TASK



PHASE-00 / TASK-00.01



Repository Initialization



Priority:



MUST



\---



\# OBJECTIVE



Create the initial MABA PRINTING repository structure and root npm workspace.



Do not initialize frontend/backend application frameworks yet.



Those belong to later Phase 00 tasks.



\---



\# REQUIRED CONTEXT



Before making changes:



1\. Read the Master Prompt.

2\. Read Phase 00.

3\. Read PROJECT\_STATE.md.

4\. Read DECISIONS.md.

5\. Read CURRENT\_TASK.md.

6\. Inspect the current filesystem/repository.



If a repository already exists, do not overwrite it blindly.



Report meaningful conflicts.



\---



\# REQUIRED STRUCTURE



Establish:



maba-printing/

├── apps/

│   ├── web/

│   └── api/

├── packages/

│   └── shared/

├── docs/

│   └── ai/

├── package.json

├── .gitignore

├── .env.example

└── README.md



Preserve approved specification documents inside `docs/`.



\---



\# ROOT PACKAGE



Create a private root npm package configured for workspaces.



Expected workspace families:



\- apps/\*

\- packages/\*



Do not install application dependencies yet unless strictly necessary for workspace initialization.



\---



\# GITIGNORE



At minimum account for:



\- node\_modules

\- build output

\- coverage

\- environment files

\- logs

\- editor/OS artifacts where appropriate



Do not ignore `.env.example`.



\---



\# ENVIRONMENT TEMPLATE



Create `.env.example`.



At this stage it may document planned environment variable names.



Never include real secrets.



Do not create unnecessary production configuration.



\---



\# README



Create an initial README containing:



\- project name

\- short description

\- approved stack summary

\- repository structure

\- development status

\- reference to docs



Do not claim unimplemented features are available.



\---



\# DOCUMENTATION



Ensure the approved project documentation has an appropriate location under:



`docs/`



and AI project-memory files under:



`docs/ai/`



Do not rewrite approved PRD/Architecture merely to complete this task.



\---



\# OUT OF SCOPE



Do NOT:



\- initialize Vite

\- initialize Express

\- initialize Prisma

\- configure PostgreSQL

\- implement authentication

\- create product code

\- create order code

\- create UI

\- install large dependency sets



\---



\# VERIFICATION



Verify:



\- expected directories exist

\- root package.json is valid JSON

\- root package is private

\- npm workspaces are correctly declared

\- `.gitignore` exists

\- `.env.example` contains no secret

\- README accurately represents project status

\- approved docs remain intact



If npm provides an appropriate workspace validation/install command, run it where meaningful.



\---



\# PROJECT MEMORY



After successful verification:



Update `PROJECT\_STATE.md` accurately.



Record TASK-00.01 in `CHANGELOG\_AI.md`.



Update `CURRENT\_TASK.md` to reflect the completed task.



Do not automatically mark TASK-00.02 as started.



\---



\# REQUIRED FINAL STATUS



Return:



COMPLETED



only if verification passes.



Otherwise use:



BLOCKED



FAILED\_VERIFICATION



or



AWAITING\_APPROVAL



as appropriate.



After reporting:



STOP.



Do not begin TASK-00.02.

