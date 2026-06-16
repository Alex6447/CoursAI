from app.parsing.course import parse_course


def test_ten_modules():
    modules = parse_course()
    assert len(modules) == 10
    assert [m.number for m in modules] == list(range(1, 11))


def test_module_ids_stable():
    modules = parse_course()
    assert modules[0].id == "course:module-1"
    assert modules[4].id == "course:module-5"


def test_module_5_is_rag_with_criterion():
    modules = {m.number: m for m in parse_course()}
    m5 = modules[5]
    assert "RAG" in m5.title
    assert m5.acceptance_criterion.strip()
    assert m5.study_points
    assert m5.task


def test_module_8_optional():
    modules = {m.number: m for m in parse_course()}
    assert modules[8].optional is True
    assert modules[1].optional is False
