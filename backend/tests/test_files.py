import pytest

def test_file_response_schema():
    from schemas.file import FileShareResponse
    resp = FileShareResponse(share_token="xyz", share_url="http://localhost")
    assert resp.share_token == "xyz"
