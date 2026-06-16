from app.parsing.loader import SOURCE_DOCS, find_docs_dir, load_all


def test_docs_dir_found():
    docs_dir = find_docs_dir()
    assert docs_dir.is_dir()


def test_all_sources_have_frontmatter_and_body():
    docs = load_all()
    assert set(docs) == set(SOURCE_DOCS)
    for key, doc in docs.items():
        assert doc.title, f"{key}: пустой title"
        assert doc.doc_type, f"{key}: пустой type"
        assert doc.body.strip(), f"{key}: пустое тело"
