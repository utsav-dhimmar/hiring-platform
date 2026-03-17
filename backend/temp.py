import docx2txt
from markitdown import MarkItDown

md = MarkItDown()
result = md.convert(r"D:\codes\projects\resume-test\ats.docx")
print(docx2txt.process(r"D:\codes\projects\resume-test\ats.docx"))
