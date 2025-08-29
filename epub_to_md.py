#!/usr/bin/env python3
"""
EPUB to Markdown Converter
Splits an EPUB file into separate markdown files per chapter.
"""

import zipfile
import xml.etree.ElementTree as ET
import html2text
import os
import re
from pathlib import Path


class EpubToMarkdown:
    def __init__(self, epub_path):
        self.epub_path = epub_path
        self.h2t = html2text.HTML2Text()
        self.h2t.ignore_links = False
        self.h2t.ignore_images = False
        self.h2t.body_width = 0  # Don't wrap lines
        
    def extract_epub(self):
        """Extract and parse the EPUB file"""
        with zipfile.ZipFile(self.epub_path, 'r') as epub:
            # Read container.xml to find the OPF file
            container_xml = epub.read('META-INF/container.xml')
            container_root = ET.fromstring(container_xml)
            
            # Find the OPF file path
            opf_path = container_root.find('.//{urn:oasis:names:tc:opendocument:xmlns:container}rootfile').get('full-path')
            
            # Read and parse the OPF file
            opf_content = epub.read(opf_path)
            opf_root = ET.fromstring(opf_content)
            
            # Get the base directory for content files
            base_dir = os.path.dirname(opf_path)
            
            # Extract spine order (reading order)
            spine_items = []
            for itemref in opf_root.findall('.//{http://www.idpf.org/2007/opf}itemref'):
                idref = itemref.get('idref')
                spine_items.append(idref)
            
            # Map item IDs to file paths
            manifest = {}
            for item in opf_root.findall('.//{http://www.idpf.org/2007/opf}item'):
                item_id = item.get('id')
                href = item.get('href')
                media_type = item.get('media-type')
                if media_type in ['application/xhtml+xml', 'text/html']:
                    full_path = os.path.join(base_dir, href) if base_dir else href
                    manifest[item_id] = full_path
            
            # Extract chapters in spine order
            chapters = []
            for i, item_id in enumerate(spine_items):
                if item_id in manifest:
                    try:
                        file_path = manifest[item_id]
                        content = epub.read(file_path).decode('utf-8')
                        
                        # Parse HTML content
                        # Remove XML declaration and DOCTYPE if present
                        content = re.sub(r'<\?xml[^>]*\?>', '', content)
                        content = re.sub(r'<!DOCTYPE[^>]*>', '', content)
                        
                        # Extract title from content or use filename
                        title = self.extract_title(content)
                        if not title:
                            title = f"Chapter {i+1}"
                        
                        chapters.append({
                            'title': title,
                            'content': content,
                            'order': i
                        })
                    except Exception as e:
                        print(f"Warning: Could not process {file_path}: {e}")
                        continue
            
            return chapters
    
    def extract_title(self, html_content):
        """Extract title from HTML content"""
        try:
            # Try to find title in h1, h2, or title tags
            root = ET.fromstring(f"<root>{html_content}</root>")
            
            for tag in ['h1', 'h2', 'title']:
                title_elem = root.find(f".//{tag}")
                if title_elem is not None and title_elem.text:
                    return title_elem.text.strip()
            
            return None
        except:
            # Fallback: use regex to find title
            title_match = re.search(r'<h[12][^>]*>([^<]+)</h[12]>', html_content, re.IGNORECASE)
            if title_match:
                return title_match.group(1).strip()
            return None
    
    def html_to_markdown(self, html_content):
        """Convert HTML content to Markdown"""
        return self.h2t.handle(html_content)
    
    def sanitize_filename(self, filename):
        """Sanitize filename for filesystem"""
        # Remove or replace invalid characters
        filename = re.sub(r'[<>:"/\\|?*]', '', filename)
        filename = re.sub(r'\s+', '_', filename)
        return filename[:100]  # Limit length
    
    def convert(self, output_dir='chapters'):
        """Convert EPUB to markdown files"""
        # Create output directory
        Path(output_dir).mkdir(exist_ok=True)
        
        # Extract chapters
        chapters = self.extract_epub()
        
        print(f"Found {len(chapters)} chapters")
        
        # Convert each chapter to markdown
        for chapter in chapters:
            # Convert HTML to Markdown
            markdown_content = self.html_to_markdown(chapter['content'])
            
            # Create filename
            safe_title = self.sanitize_filename(chapter['title'])
            filename = f"{chapter['order']:02d}_{safe_title}.md"
            filepath = os.path.join(output_dir, filename)
            
            # Write markdown file
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(f"# {chapter['title']}\n\n")
                f.write(markdown_content)
            
            print(f"Created: {filepath}")
        
        print(f"\nConversion complete! {len(chapters)} chapters saved to '{output_dir}' directory.")


def main():
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python epub_to_md.py <epub_file>")
        sys.exit(1)
    
    epub_file = sys.argv[1]
    
    if not os.path.exists(epub_file):
        print(f"Error: File '{epub_file}' not found")
        sys.exit(1)
    
    if not epub_file.lower().endswith('.epub'):
        print("Error: File must be an EPUB file (.epub extension)")
        sys.exit(1)
    
    try:
        converter = EpubToMarkdown(epub_file)
        converter.convert()
    except Exception as e:
        print(f"Error converting EPUB: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()