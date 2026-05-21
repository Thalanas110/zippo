cd C:\Users\Adriaan Dimate\Desktop\zippo-is\backend
conda env create -f environment.yml
(If it already exists: conda env update -f environment.yml --prune)
conda activate zippo-backend
python -m uvicorn app:app --reload

