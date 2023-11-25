import subprocess
import zipfile
import os

def get_git_tag():
    try:
        return subprocess.check_output(['git', 'describe', '--tags']).strip().decode('utf-8')
    except subprocess.CalledProcessError:
        return 'no-tag'

current_tag = get_git_tag()

zip_file_name = current_tag + '.zip'
zip_path = zip_file_name

files_to_add = os.listdir('.')

def add_files_to_zip(zipf, path, zip_path):
    for root, dirs, files in os.walk(path):
        if ('assets' in root.split(os.sep) or '.git' in root.split(os.sep) \
            or '.idea' in root.split(os.sep)):
            continue
        for file in files:
            if (not str(file).endswith(".psd") and not str(file).endswith(".zip") \
                and not str(file).endswith(".gitignore") and not str(file).endswith(".prettierrc") \
                and not str(file).endswith(".DS_Store") and not str(file).endswith(".py") \
                and not str(file).endswith(".github") and not str(file).endswith("articles.json") \
                and not str(file).endswith("data.json")):
                relative_path = os.path.join(root, file)
                zipf.write(relative_path, os.path.relpath(relative_path, zip_path))

with zipfile.ZipFile(zip_path, 'w') as myzip:
    add_files_to_zip(myzip, '.', os.path.dirname(zip_path))
print(f"ZIP file {zip_file_name} was created.")
