import subprocess
import json
import os
import sys

SOLVER_EXE = os.path.join(os.path.dirname(__file__), "solver.exe")

def run_solver(payload):
    process = subprocess.Popen(
        [SOLVER_EXE],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    stdout, stderr = process.communicate(input=json.dumps(payload))
    if process.returncode != 0 and not stdout:
        raise RuntimeError(f"Solver process exited with {process.returncode}: {stderr}")
    try:
        return json.loads(stdout)
    except Exception as e:
        raise ValueError(f"Failed to parse JSON output: '{stdout}'. Error: {e}")

def run_tests():
    print("=" * 65)
    print("  MAZEMASTER C++ BACKEND AUTOMATED TEST SUITE")
    print("=" * 65)
    
    passed = 0
    total = 0

    # Test 1: Midterm PDF 4x4 Exact Test Case
    total += 1
    t1_payload = {
        "rows": 4,
        "cols": 4,
        "sr": 0, "sc": 0,
        "dr": 3, "dc": 3,
        "maze": [
            [1, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 1, 1]
        ]
    }
    t1_res = run_solver(t1_payload)
    expected_path = [{"row": 0, "col": 0}, {"row": 1, "col": 0}, {"row": 1, "col": 1},
                     {"row": 2, "col": 1}, {"row": 3, "col": 1}, {"row": 3, "col": 2}, {"row": 3, "col": 3}]
    if t1_res.get("success") == True and t1_res.get("path") == expected_path:
        print("[PASS] Test 1: Midterm Exam 4x4 Exact Test Case")
        print(f"       Reconstructed Path: {[(p['row'], p['col']) for p in t1_res['path']]}")
        passed += 1
    else:
        print(f"[FAIL] Test 1: Midterm Exam 4x4. Result: {t1_res}")

    # Test 2: Maze Requiring Backtracking
    total += 1
    # Down priority will try (1,0) -> (2,0) which is a dead end, backtrack, then go right (1,1) -> (1,2) -> (2,2)
    t2_payload = {
        "rows": 3,
        "cols": 3,
        "sr": 0, "sc": 0,
        "dr": 2, "dc": 2,
        "maze": [
            [1, 0, 0],
            [1, 1, 1],
            [1, 0, 1]
        ]
    }
    t2_res = run_solver(t2_payload)
    # At (1,0), down is (2,0). (2,0) has no moves -> backtrack to (1,0), then tries right to (1,1) -> (1,2) -> (2,2)
    has_backtrack = t2_res.get("backtrackCount", 0) > 0
    if t2_res.get("success") == True and has_backtrack:
        print(f"[PASS] Test 2: Maze Requiring Backtracking (Backtrack count: {t2_res['backtrackCount']})")
        passed += 1
    else:
        print(f"[FAIL] Test 2: Expected backtracking but got {t2_res}")

    # Test 3: Maze with No Valid Path
    total += 1
    t3_payload = {
        "rows": 3,
        "cols": 3,
        "sr": 0, "sc": 0,
        "dr": 2, "dc": 2,
        "maze": [
            [1, 1, 0],
            [0, 0, 0],
            [0, 1, 1]
        ]
    }
    t3_res = run_solver(t3_payload)
    if t3_res.get("success") == False and t3_res.get("status") == "NO_PATH":
        print("[PASS] Test 3: No Path Exists (Stack emptied gracefully)")
        passed += 1
    else:
        print(f"[FAIL] Test 3: Expected failure for blocked maze. Got {t3_res}")

    # Test 4: Blocked Start Cell
    total += 1
    t4_payload = {
        "rows": 3,
        "cols": 3,
        "sr": 0, "sc": 0,
        "dr": 2, "dc": 2,
        "maze": [
            [0, 1, 1],
            [1, 1, 1],
            [1, 1, 1]
        ]
    }
    t4_res = run_solver(t4_payload)
    if t4_res.get("success") == False and t4_res.get("status") == "BLOCKED_ENDPOINT":
        print("[PASS] Test 4: Blocked Start Cell Validation")
        passed += 1
    else:
        print(f"[FAIL] Test 4: Expected BLOCKED_ENDPOINT. Got {t4_res}")

    # Test 5: Blocked Destination Cell
    total += 1
    t5_payload = {
        "rows": 3,
        "cols": 3,
        "sr": 0, "sc": 0,
        "dr": 2, "dc": 2,
        "maze": [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 0]
        ]
    }
    t5_res = run_solver(t5_payload)
    if t5_res.get("success") == False and t5_res.get("status") == "BLOCKED_ENDPOINT":
        print("[PASS] Test 5: Blocked Destination Cell Validation")
        passed += 1
    else:
        print(f"[FAIL] Test 5: Expected BLOCKED_ENDPOINT. Got {t5_res}")

    # Test 6: Invalid Coordinates (Out of bounds)
    total += 1
    t6_payload = {
        "rows": 3,
        "cols": 3,
        "sr": -1, "sc": 0,
        "dr": 3, "dc": 2,
        "maze": [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1]
        ]
    }
    t6_res = run_solver(t6_payload)
    if t6_res.get("success") == False and t6_res.get("status") == "INVALID_COORDINATES":
        print("[PASS] Test 6: Invalid Out-of-Bounds Coordinates Validation")
        passed += 1
    else:
        print(f"[FAIL] Test 6: Expected INVALID_COORDINATES. Got {t6_res}")

    # Test 7: One-cell Maze (Start == Destination)
    total += 1
    t7_payload = {
        "rows": 1,
        "cols": 1,
        "sr": 0, "sc": 0,
        "dr": 0, "dc": 0,
        "maze": [[1]]
    }
    t7_res = run_solver(t7_payload)
    if t7_res.get("success") == True and len(t7_res.get("path", [])) == 1:
        print("[PASS] Test 7: One-cell Maze (Start == Destination handled properly)")
        passed += 1
    else:
        print(f"[FAIL] Test 7: Expected single-cell success. Got {t7_res}")

    # Test 8: Larger Maze (6x6)
    total += 1
    t8_payload = {
        "rows": 6,
        "cols": 6,
        "sr": 0, "sc": 0,
        "dr": 5, "dc": 5,
        "maze": [
            [1, 0, 1, 1, 1, 1],
            [1, 1, 1, 0, 0, 1],
            [0, 0, 1, 1, 0, 1],
            [1, 1, 0, 1, 0, 1],
            [1, 0, 0, 1, 1, 1],
            [1, 1, 1, 0, 0, 1]
        ]
    }
    t8_res = run_solver(t8_payload)
    if t8_res.get("success") == True and t8_res["path"][-1] == {"row": 5, "col": 5}:
        print(f"[PASS] Test 8: 6x6 Complex Maze Solved (Total Steps: {t8_res['totalSteps']}, Path Length: {len(t8_res['path'])})")
        passed += 1
    else:
        print(f"[FAIL] Test 8: 6x6 Maze Failed. Got {t8_res}")

    print("=" * 65)
    print(f"  TEST SUMMARY: {passed} / {total} tests passed ({(passed/total)*100:.1f}%)")
    print("=" * 65)

    return passed == total

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
