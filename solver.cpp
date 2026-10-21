// ============================================================================
// PROJECT: MazeMaster — DSAL End-Term Project
// FILE: backend/solver.cpp
//
// DESCRIPTION:
// Enhanced version of the student's original stack backtracking C++ algorithm.
//
// PRESERVES EXACT STUDENT ALGORITHM:
// 1. struct Cell { int row; int col; };
// 2. isValid() checks boundary, maze[r][c] == 1, and !visited[r][c]
// 3. Direction priority strictly maintained:
//    - Down  (r + 1, c)
//    - Right (r, c + 1)
//    - Up    (r - 1, c)
//    - Left  (r, c - 1)
// 4. Mark visited immediately upon push
// 5. Backtrack when !moved by s.pop()
// 6. Path reconstruction using secondary stack reversal
// 7. Dynamic memory allocation and cleanup for maze and visited arrays
//
// ENHANCEMENTS FOR WEB INTEGRATION:
// - Reads JSON input from stdin
// - Emits structured JSON to stdout recording every algorithm event,
//   stack state snapshot, backtrack operation, and final path
// ============================================================================

#include <iostream>
#include <stack>
#include <vector>
#include <string>
#include <sstream>
#include <cctype>

using namespace std;

// Original Student Data Structure
struct Cell
{
    int row;
    int col;
};

// Represents an algorithm event recorded for live web visualization
struct AlgorithmEvent
{
    int step;
    string type;          // "START", "EXPLORE", "BACKTRACK", "GOAL", "NO_PATH"
    string action;        // "PUSH", "POP", "CHECK"
    Cell cell;
    string direction;     // "Down", "Right", "Up", "Left", or "None"
    vector<Cell> stackSnapshot; // Stack elements from bottom to top
    int visitedCount;
    string description;
};

// Original isValid function - strictly preserved
bool isValid(int** maze, bool** visited,
             int rows, int cols, int r, int c)
{
    return (r >= 0 && r < rows &&
            c >= 0 && c < cols &&
            maze[r][c] == 1 &&
            !visited[r][c]);
}

// Helper to snapshot stack from bottom to top without destroying it
vector<Cell> getStackSnapshot(stack<Cell> s)
{
    vector<Cell> reversed;
    while (!s.empty())
    {
        reversed.push_back(s.top());
        s.pop();
    }
    vector<Cell> snapshot;
    for (int i = (int)reversed.size() - 1; i >= 0; i--)
    {
        snapshot.push_back(reversed[i]);
    }
    return snapshot;
}

// Helper to escape strings for JSON
string escapeJson(const string& str)
{
    string out = "";
    for (char ch : str)
    {
        if (ch == '"') out += "\\\"";
        else if (ch == '\\') out += "\\\\";
        else if (ch == '\n') out += "\\n";
        else if (ch == '\r') out += "\\r";
        else if (ch == '\t') out += "\\t";
        else out += ch;
    }
    return out;
}

// Main Maze Solving Algorithm with Event Recording
void solveMazeTracked(int** maze, int rows, int cols,
                      int sr, int sc, int dr, int dc,
                      vector<AlgorithmEvent>& events,
                      vector<Cell>& finalPath,
                      bool& pathFound,
                      int& totalVisitedCount,
                      int& totalBacktracks)
{
    stack<Cell> s;
    int stepCounter = 1;
    totalVisitedCount = 0;
    totalBacktracks = 0;
    pathFound = false;

    // Dynamically allocate visited array (identical to student's code)
    bool** visited = new bool*[rows];
    for (int i = 0; i < rows; i++)
    {
        visited[i] = new bool[cols];
        for (int j = 0; j < cols; j++)
        {
            visited[i][j] = false;
        }
    }

    // Push starting cell and mark visited (identical to student's code)
    s.push({sr, sc});
    visited[sr][sc] = true;
    totalVisitedCount++;

    events.push_back({
        stepCounter++,
        "START",
        "PUSH",
        {sr, sc},
        "None",
        getStackSnapshot(s),
        totalVisitedCount,
        "Initialized search. Pushed start cell (" + to_string(sr) + ", " + to_string(sc) + ") onto stack."
    });

    while (!s.empty())
    {
        Cell current = s.top();

        // Destination checking (identical to student's code)
        if (current.row == dr && current.col == dc)
        {
            pathFound = true;

            events.push_back({
                stepCounter++,
                "GOAL",
                "CHECK",
                current,
                "None",
                getStackSnapshot(s),
                totalVisitedCount,
                "Destination cell (" + to_string(dr) + ", " + to_string(dc) + ") reached! Reconstructing path."
            });

            // Original student path reconstruction using secondary stack
            stack<Cell> path;
            stack<Cell> s_copy = s; // Copy so s remains intact for snapshots
            while (!s_copy.empty())
            {
                path.push(s_copy.top());
                s_copy.pop();
            }

            while (!path.empty())
            {
                finalPath.push_back(path.top());
                path.pop();
            }

            // Cleanup visited memory (identical to student's code)
            for (int i = 0; i < rows; i++)
                delete[] visited[i];
            delete[] visited;

            return;
        }

        int r = current.row;
        int c = current.col;
        bool moved = false;

        // Direction priority strictly preserved:
        // 1. Down  (r + 1, c)
        // 2. Right (r, c + 1)
        // 3. Up    (r - 1, c)
        // 4. Left  (r, c - 1)

        if (isValid(maze, visited, rows, cols, r + 1, c))
        {
            s.push({r + 1, c});
            visited[r + 1][c] = true;
            moved = true;
            totalVisitedCount++;

            events.push_back({
                stepCounter++,
                "EXPLORE",
                "PUSH",
                {r + 1, c},
                "Down",
                getStackSnapshot(s),
                totalVisitedCount,
                "Valid unvisited cell found below. Moved Down to (" + to_string(r + 1) + ", " + to_string(c) + ") and pushed onto stack."
            });
        }
        else if (isValid(maze, visited, rows, cols, r, c + 1))
        {
            s.push({r, c + 1});
            visited[r][c + 1] = true;
            moved = true;
            totalVisitedCount++;

            events.push_back({
                stepCounter++,
                "EXPLORE",
                "PUSH",
                {r, c + 1},
                "Right",
                getStackSnapshot(s),
                totalVisitedCount,
                "Valid unvisited cell found to the right. Moved Right to (" + to_string(r) + ", " + to_string(c + 1) + ") and pushed onto stack."
            });
        }
        else if (isValid(maze, visited, rows, cols, r - 1, c))
        {
            s.push({r - 1, c});
            visited[r - 1][c] = true;
            moved = true;
            totalVisitedCount++;

            events.push_back({
                stepCounter++,
                "EXPLORE",
                "PUSH",
                {r - 1, c},
                "Up",
                getStackSnapshot(s),
                totalVisitedCount,
                "Valid unvisited cell found above. Moved Up to (" + to_string(r - 1) + ", " + to_string(c) + ") and pushed onto stack."
            });
        }
        else if (isValid(maze, visited, rows, cols, r, c - 1))
        {
            s.push({r, c - 1});
            visited[r][c - 1] = true;
            moved = true;
            totalVisitedCount++;

            events.push_back({
                stepCounter++,
                "EXPLORE",
                "PUSH",
                {r, c - 1},
                "Left",
                getStackSnapshot(s),
                totalVisitedCount,
                "Valid unvisited cell found to the left. Moved Left to (" + to_string(r) + ", " + to_string(c - 1) + ") and pushed onto stack."
            });
        }

        // Backtracking condition (identical to student's code)
        if (!moved)
        {
            Cell popped = s.top();
            s.pop();
            totalBacktracks++;

            events.push_back({
                stepCounter++,
                "BACKTRACK",
                "POP",
                popped,
                "None",
                getStackSnapshot(s),
                totalVisitedCount,
                "Dead end encountered at (" + to_string(popped.row) + ", " + to_string(popped.col) + "). No valid unvisited neighbours. Popped from stack (backtracking)."
            });
        }
    }

    // No path found (stack became empty)
    events.push_back({
        stepCounter++,
        "NO_PATH",
        "CHECK",
        {-1, -1},
        "None",
        {},
        totalVisitedCount,
        "Stack is empty and destination was never reached. No path exists."
    });

    for (int i = 0; i < rows; i++)
        delete[] visited[i];
    delete[] visited;
}

// Simple JSON Tokenizer & Parser for robust input handling
struct ParsedInput
{
    int rows = 0;
    int cols = 0;
    int sr = -1;
    int sc = -1;
    int dr = -1;
    int dc = -1;
    vector<vector<int>> grid;
    bool valid = false;
    string errorMessage = "";
};

ParsedInput parseInputJson(const string& jsonStr)
{
    ParsedInput p;

    // Helper to find integer value after key
    auto findInt = [&](const string& key) -> int {
        size_t pos = jsonStr.find("\"" + key + "\"");
        if (pos == string::npos) pos = jsonStr.find(key);
        if (pos == string::npos) return -999999;
        size_t colon = jsonStr.find(':', pos);
        if (colon == string::npos) return -999999;
        size_t start = colon + 1;
        while (start < jsonStr.size() && (isspace(jsonStr[start]) || jsonStr[start] == '"')) start++;
        int sign = 1;
        if (start < jsonStr.size() && jsonStr[start] == '-') { sign = -1; start++; }
        int val = 0;
        bool found = false;
        while (start < jsonStr.size() && isdigit(jsonStr[start]))
        {
            val = val * 10 + (jsonStr[start] - '0');
            start++;
            found = true;
        }
        return found ? (val * sign) : -999999;
    };

    p.rows = findInt("rows");
    p.cols = findInt("cols");

    // Coordinates can be sr/sc/dr/dc or nested inside start/destination
    int sr = findInt("sr");
    int sc = findInt("sc");
    int dr = findInt("dr");
    int dc = findInt("dc");

    if (sr == -999999 || sc == -999999)
    {
        size_t sPos = jsonStr.find("\"start\"");
        if (sPos != string::npos)
        {
            string startSub = jsonStr.substr(sPos, 60);
            size_t rPos = startSub.find("\"row\"");
            size_t cPos = startSub.find("\"col\"");
            if (rPos != string::npos && cPos != string::npos)
            {
                // find row & col
                size_t col1 = startSub.find(':', rPos);
                size_t col2 = startSub.find(':', cPos);
                if (col1 != string::npos) sr = stoi(startSub.substr(col1 + 1));
                if (col2 != string::npos) sc = stoi(startSub.substr(col2 + 1));
            }
        }
    }

    if (dr == -999999 || dc == -999999)
    {
        size_t dPos = jsonStr.find("\"destination\"");
        if (dPos != string::npos)
        {
            string destSub = jsonStr.substr(dPos, 60);
            size_t rPos = destSub.find("\"row\"");
            size_t cPos = destSub.find("\"col\"");
            if (rPos != string::npos && cPos != string::npos)
            {
                size_t col1 = destSub.find(':', rPos);
                size_t col2 = destSub.find(':', cPos);
                if (col1 != string::npos) dr = stoi(destSub.substr(col1 + 1));
                if (col2 != string::npos) dc = stoi(destSub.substr(col2 + 1));
            }
        }
    }

    p.sr = sr;
    p.sc = sc;
    p.dr = dr;
    p.dc = dc;

    // Parse 2D maze array
    size_t mazePos = jsonStr.find("\"maze\"");
    if (mazePos == string::npos)
    {
        p.errorMessage = "Missing 'maze' array in input JSON.";
        return p;
    }
    size_t arrStart = jsonStr.find('[', mazePos);
    if (arrStart == string::npos)
    {
        p.errorMessage = "Malformed 'maze' array in input JSON.";
        return p;
    }

    vector<vector<int>> grid;
    vector<int> currentRow;
    bool inSubArr = false;

    for (size_t i = arrStart + 1; i < jsonStr.size(); i++)
    {
        char ch = jsonStr[i];
        if (ch == '[')
        {
            inSubArr = true;
            currentRow.clear();
        }
        else if (ch == ']')
        {
            if (inSubArr)
            {
                grid.push_back(currentRow);
                inSubArr = false;
            }
            else
            {
                // End of 2D maze array
                break;
            }
        }
        else if (inSubArr && (ch == '0' || ch == '1'))
        {
            currentRow.push_back(ch - '0');
        }
    }

    p.grid = grid;
    if (p.rows <= 0) p.rows = (int)grid.size();
    if (p.cols <= 0 && !grid.empty()) p.cols = (int)grid[0].size();

    p.valid = true;
    return p;
}

int main()
{
    // Read complete JSON from standard input
    string inputContent = "";
    string line;
    while (getline(cin, line))
    {
        inputContent += line + "\n";
    }

    if (inputContent.empty())
    {
        cout << "{\"success\": false, \"status\": \"ERROR\", \"message\": \"Empty input received.\"}\n";
        return 0;
    }

    ParsedInput input = parseInputJson(inputContent);

    if (!input.valid)
    {
        cout << "{\"success\": false, \"status\": \"INVALID_JSON\", \"message\": \""
             << escapeJson(input.errorMessage) << "\"}\n";
        return 0;
    }

    int rows = input.rows;
    int cols = input.cols;
    int sr = input.sr;
    int sc = input.sc;
    int dr = input.dr;
    int dc = input.dc;

    // Validation checks exactly from student's code
    if (rows <= 0 || cols <= 0)
    {
        cout << "{\"success\": false, \"status\": \"INVALID_DIMENSIONS\", \"message\": \"Rows and columns must be positive numbers.\"}\n";
        return 0;
    }

    if (sr < 0 || sr >= rows || sc < 0 || sc >= cols ||
        dr < 0 || dr >= rows || dc < 0 || dc >= cols)
    {
        cout << "{\"success\": false, \"status\": \"INVALID_COORDINATES\", \"message\": \"Invalid starting or destination position! Coordinates out of bounds.\"}\n";
        return 0;
    }

    // Allocate dynamic maze array (identical to student's code)
    int** maze = new int*[rows];
    for (int i = 0; i < rows; i++)
    {
        maze[i] = new int[cols];
        for (int j = 0; j < cols; j++)
        {
            if (i < (int)input.grid.size() && j < (int)input.grid[i].size())
                maze[i][j] = input.grid[i][j];
            else
                maze[i][j] = 1; // Default open if unspecified
        }
    }

    // Endpoint validation exactly from student's code
    if (maze[sr][sc] == 0 || maze[dr][dc] == 0)
    {
        cout << "{\"success\": false, \"status\": \"BLOCKED_ENDPOINT\", \"message\": \"Start and destination must be open cells!\"}\n";
        for (int i = 0; i < rows; i++) delete[] maze[i];
        delete[] maze;
        return 0;
    }

    vector<AlgorithmEvent> events;
    vector<Cell> finalPath;
    bool pathFound = false;
    int totalVisited = 0;
    int totalBacktracks = 0;

    solveMazeTracked(maze, rows, cols, sr, sc, dr, dc,
                     events, finalPath, pathFound, totalVisited, totalBacktracks);

    // Emit valid structured JSON to stdout
    ostringstream out;
    out << "{\n";
    out << "  \"success\": " << (pathFound ? "true" : "false") << ",\n";
    out << "  \"status\": \"" << (pathFound ? "PATH_FOUND" : "NO_PATH") << "\",\n";
    out << "  \"message\": \"" << (pathFound ? "Path found successfully!" : "No path exists from start to destination.") << "\",\n";
    out << "  \"rows\": " << rows << ",\n";
    out << "  \"cols\": " << cols << ",\n";
    out << "  \"start\": {\"row\": " << sr << ", \"col\": " << sc << "},\n";
    out << "  \"destination\": {\"row\": " << dr << ", \"col\": " << dc << "},\n";
    out << "  \"totalSteps\": " << events.size() << ",\n";
    out << "  \"visitedCellsCount\": " << totalVisited << ",\n";
    out << "  \"backtrackCount\": " << totalBacktracks << ",\n";

    // Final path array (ordered start to destination)
    out << "  \"path\": [";
    for (size_t i = 0; i < finalPath.size(); i++)
    {
        out << "{\"row\": " << finalPath[i].row << ", \"col\": " << finalPath[i].col << "}";
        if (i + 1 < finalPath.size()) out << ", ";
    }
    out << "],\n";

    // Events trace array
    out << "  \"events\": [\n";
    for (size_t i = 0; i < events.size(); i++)
    {
        const auto& ev = events[i];
        out << "    {\n";
        out << "      \"step\": " << ev.step << ",\n";
        out << "      \"type\": \"" << ev.type << "\",\n";
        out << "      \"action\": \"" << ev.action << "\",\n";
        out << "      \"cell\": {\"row\": " << ev.cell.row << ", \"col\": " << ev.cell.col << "},\n";
        out << "      \"direction\": \"" << ev.direction << "\",\n";
        out << "      \"visitedCount\": " << ev.visitedCount << ",\n";
        out << "      \"description\": \"" << escapeJson(ev.description) << "\",\n";
        out << "      \"stack\": [";
        for (size_t j = 0; j < ev.stackSnapshot.size(); j++)
        {
            out << "{\"row\": " << ev.stackSnapshot[j].row << ", \"col\": " << ev.stackSnapshot[j].col << "}";
            if (j + 1 < ev.stackSnapshot.size()) out << ", ";
        }
        out << "]\n";
        out << "    }";
        if (i + 1 < events.size()) out << ",";
        out << "\n";
    }
    out << "  ]\n";
    out << "}\n";

    cout << out.str();

    // Clean up dynamic maze array (identical to student's code)
    for (int i = 0; i < rows; i++)
        delete[] maze[i];
    delete[] maze;

    return 0;
}
