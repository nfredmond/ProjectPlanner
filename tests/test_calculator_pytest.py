"""Tests for the calculator module using pytest."""

import pytest
from python_utils.calculator import add, subtract, multiply, divide, square, factorial


def test_add():
    """Test the add function with various inputs."""
    assert add(1, 2) == 3
    assert add(-1, 1) == 0
    assert add(-1, -1) == -2
    assert add(0, 0) == 0
    assert add(1.5, 2.5) == 4.0


def test_subtract():
    """Test the subtract function with various inputs."""
    assert subtract(5, 3) == 2
    assert subtract(1, 1) == 0
    assert subtract(-1, -1) == 0
    assert subtract(0, 5) == -5
    # For floating point, we use pytest.approx
    assert subtract(5.5, 2.2) == pytest.approx(3.3)


def test_multiply():
    """Test the multiply function with various inputs."""
    assert multiply(2, 3) == 6
    assert multiply(-2, 3) == -6
    assert multiply(-2, -3) == 6
    assert multiply(0, 5) == 0
    assert multiply(2.5, 2) == 5.0


def test_divide():
    """Test the divide function with various inputs."""
    assert divide(6, 3) == 2
    assert divide(-6, 3) == -2
    assert divide(-6, -3) == 2
    assert divide(0, 5) == 0
    assert divide(5, 2) == 2.5


def test_divide_by_zero():
    """Test that dividing by zero raises a ZeroDivisionError."""
    with pytest.raises(ZeroDivisionError):
        divide(5, 0)


def test_square():
    """Test the square function with various inputs."""
    assert square(2) == 4
    assert square(-2) == 4
    assert square(0) == 0
    assert square(1.5) == 2.25


def test_factorial():
    """Test the factorial function with various inputs."""
    assert factorial(0) == 1
    assert factorial(1) == 1
    assert factorial(5) == 120


def test_factorial_negative():
    """Test that factorial raises ValueError for negative inputs."""
    with pytest.raises(ValueError):
        factorial(-1)


def test_factorial_non_integer():
    """Test that factorial raises TypeError for non-integer inputs."""
    with pytest.raises(TypeError):
        factorial(1.5)


# Parameterized tests
@pytest.mark.parametrize("a, b, expected", [
    (1, 2, 3),
    (-1, 1, 0),
    (-1, -1, -2),
    (0, 0, 0),
    (1.5, 2.5, 4.0),
])
def test_add_parametrized(a, b, expected):
    """Test the add function with parametrized inputs."""
    assert add(a, b) == expected


# Fixture example
@pytest.fixture
def sample_numbers():
    """Fixture providing sample numbers for tests."""
    return {
        "integers": [(1, 2), (5, 3), (-2, -3)],
        "floats": [(1.5, 2.5), (3.3, 2.2)]
    }


def test_add_with_fixture(sample_numbers):
    """Test the add function using a fixture for test data."""
    for a, b in sample_numbers["integers"]:
        assert isinstance(add(a, b), int)
    
    for a, b in sample_numbers["floats"]:
        assert isinstance(add(a, b), float) 