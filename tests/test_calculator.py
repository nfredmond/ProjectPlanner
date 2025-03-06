"""Tests for the calculator module."""

import unittest
from python_utils.calculator import add, subtract, multiply, divide, square, factorial


class TestCalculator(unittest.TestCase):
    """Test class for calculator module functions."""

    def test_add(self):
        """Test the add function with various inputs."""
        self.assertEqual(add(1, 2), 3)
        self.assertEqual(add(-1, 1), 0)
        self.assertEqual(add(-1, -1), -2)
        self.assertEqual(add(0, 0), 0)
        self.assertEqual(add(1.5, 2.5), 4.0)

    def test_subtract(self):
        """Test the subtract function with various inputs."""
        self.assertEqual(subtract(5, 3), 2)
        self.assertEqual(subtract(1, 1), 0)
        self.assertEqual(subtract(-1, -1), 0)
        self.assertEqual(subtract(0, 5), -5)
        self.assertEqual(subtract(5.5, 2.2), 3.3, "Floating point subtraction should be close enough")

    def test_multiply(self):
        """Test the multiply function with various inputs."""
        self.assertEqual(multiply(2, 3), 6)
        self.assertEqual(multiply(-2, 3), -6)
        self.assertEqual(multiply(-2, -3), 6)
        self.assertEqual(multiply(0, 5), 0)
        self.assertEqual(multiply(2.5, 2), 5.0)

    def test_divide(self):
        """Test the divide function with various inputs."""
        self.assertEqual(divide(6, 3), 2)
        self.assertEqual(divide(-6, 3), -2)
        self.assertEqual(divide(-6, -3), 2)
        self.assertEqual(divide(0, 5), 0)
        self.assertEqual(divide(5, 2), 2.5)

    def test_divide_by_zero(self):
        """Test that dividing by zero raises a ZeroDivisionError."""
        with self.assertRaises(ZeroDivisionError):
            divide(5, 0)

    def test_square(self):
        """Test the square function with various inputs."""
        self.assertEqual(square(2), 4)
        self.assertEqual(square(-2), 4)
        self.assertEqual(square(0), 0)
        self.assertEqual(square(1.5), 2.25)

    def test_factorial(self):
        """Test the factorial function with various inputs."""
        self.assertEqual(factorial(0), 1)
        self.assertEqual(factorial(1), 1)
        self.assertEqual(factorial(5), 120)
        
    def test_factorial_errors(self):
        """Test that factorial raises appropriate errors."""
        with self.assertRaises(ValueError):
            factorial(-1)
        
        with self.assertRaises(TypeError):
            factorial(1.5)


if __name__ == "__main__":
    unittest.main() 