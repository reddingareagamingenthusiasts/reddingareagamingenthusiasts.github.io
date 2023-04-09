import os
import re

# Set the domain to search for hardcoded links
domain = "8b.io"

# Set the file path to your downloaded index.html
html_file = "index.html"

def find_and_replace_links(file_path):
    with open(file_path, "r") as file:
        content = file.read()

    # Find all links to the specified domain
    regex_pattern = f'(https?://[^\s"]*{domain}/[^\s"\'\)]*)'
    links = re.findall(regex_pattern, content)

    # Download assets and update links
    for link in links:
        asset_path = link.split(domain, 1)[1].lstrip("/")
        local_path = os.path.join("assets", asset_path)

        # Download asset
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        os.system(f"wget -nc -O {local_path} {link}")

        # Replace hardcoded link with local link
        content = content.replace(link, local_path)

    # Write updated content to the file
    with open(file_path, "w") as file:
        file.write(content)

if __name__ == "__main__":
    find_and_replace_links(html_file)