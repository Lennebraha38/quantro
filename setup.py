from setuptools import setup, find_packages

setup(
    name="quantro",
    version="1.0.0",
    package_dir={"": "python"},
    packages=find_packages(where="python"),
    entry_points={
        "console_scripts": [
            "quantro=quantro.cli:main",
        ],
    },
)
