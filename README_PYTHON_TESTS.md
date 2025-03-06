# Python Testing Examples

This directory contains examples of Python code with different testing approaches. The code includes a simple calculator module, a bank account class, and various tests demonstrating different testing techniques.

## Project Structure

```
.
├── python_utils/             # Python package with code to test
│   ├── __init__.py           # Package initialization
│   ├── calculator.py         # Simple calculator functions
│   └── bank_account.py       # Bank account class implementation
└── tests/                    # Test directory
    ├── __init__.py           # Test package initialization
    ├── test_calculator.py    # Tests for calculator using unittest
    ├── test_calculator_pytest.py  # Tests for calculator using pytest
    └── test_bank_account.py  # Tests for BankAccount using pytest
```

## Setup and Installation

1. Ensure you have Python 3.9+ installed:

```bash
python --version
```

2. Create and activate a virtual environment:

```bash
# On Windows
python -m venv .venv
.venv\Scripts\activate
```

3. Install the required testing dependencies:

```bash
pip install pytest pytest-cov
```

## Running the Tests

### Using unittest

To run the unittest tests:

```bash
python -m unittest tests/test_calculator.py
```

Or to run a specific test class:

```bash
python -m unittest tests.test_calculator.TestCalculator
```

Or to run a specific test method:

```bash
python -m unittest tests.test_calculator.TestCalculator.test_add
```

### Using pytest

To run all the pytest tests:

```bash
python -m pytest
```

To run a specific test file:

```bash
python -m pytest tests/test_calculator_pytest.py
```

To run a specific test function:

```bash
python -m pytest tests/test_calculator_pytest.py::test_add
```

To run tests with a specific name pattern:

```bash
python -m pytest -k "add"  # Runs all tests with "add" in the name
```

## Test Coverage

To see test coverage, install the coverage package:

```bash
pip install pytest-cov
```

Then run pytest with coverage:

```bash
python -m pytest --cov=python_utils
```

For a detailed HTML report:

```bash
python -m pytest --cov=python_utils --cov-report=html
```

This will create a `htmlcov` directory with an HTML report.

## Test Features Demonstrated

1. **Basic assertions** - Checking expected vs. actual values
2. **Exception testing** - Testing that code raises expected exceptions
3. **Fixtures** - Providing reusable test data and objects
4. **Parameterized tests** - Running the same test with different inputs
5. **Class-based tests** - Organizing tests using classes
6. **Test organization** - Structuring tests for maintainability

## Best Practices

- Write tests before or alongside code (Test-Driven Development)
- Keep tests simple and focused on one thing
- Use descriptive test names
- Use fixtures for common setup
- Make tests independent of each other
- Test both normal cases and edge cases
- Test error conditions

## Further Resources

- [pytest documentation](https://docs.pytest.org/)
- [unittest documentation](https://docs.python.org/3/library/unittest.html)
- [Python Testing with pytest (book)](https://pragprog.com/titles/bopytest/python-testing-with-pytest/) 