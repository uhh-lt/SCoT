from abc import ABC, ABCMeta, abstractmethod
from typing import Protocol, Tuple

# 1. Duck Typing - subclassing 
# can override or break contract
 
# 2. ABSTRACT BASE CLASS
# Reicht eigentlich aus und ist streng genug
class DbInterface(Protocol):
    @abstractmethod
    def printer(self, par1:str) -> str:
        pass

class DBPrinter(DbInterface):
    def printer(self, par1:str) -> Tuple[str, int]:
        print("test AbstracClas" + par1)
        return "", 5

# 3. Formal Interface with 

class FormalDbInterface(metaclass=ABCMeta):
    @classmethod
    def __subclasshook__(cls, subclass):
        return (hasattr(subclass, 'printer') and callable(subclass.printer) or NotImplemented)
    
    @abstractmethod
    def printer(self):
        raise NotImplementedError

class DBPrinter2(FormalDbInterface):
    def printer(self):
        print("test Formal")


def main():
    db_printer = DBPrinter()
    db_printer.printer("param1")
    #print (issubclass(DBPrinter, DbInterface))
    db_printer2 = DBPrinter2()
    db_printer2.printer()
    print (issubclass(DBPrinter2, FormalDbInterface))
    

if __name__ == "__main__":
    main()