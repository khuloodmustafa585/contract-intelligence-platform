import io
from fastapi import UploadFile

from app.utils.file_helpers import save_file


def test_save_file_valid_txt_or_supported_file(tmp_path, monkeypatch):
    content = b"sample file content"
    fake_file = UploadFile(filename="test.pdf", file=io.BytesIO(content))

    # إذا UPLOAD_DIR داخل constants ثابت، ممكن تحتاجوا monkeypatch
    monkeypatch.setattr("app.utils.file_helpers.UPLOAD_DIR", str(tmp_path))

    saved_path = save_file(fake_file, "test.pdf")

    assert saved_path != ""
    with open(saved_path, "rb") as f:
        assert f.read() == content