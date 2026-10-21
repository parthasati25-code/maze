// ============================================================================
// PROBLEM STATEMENT: Maze Backtracking Using Stack
// Student Submission from Midterm Exam
// ============================================================================

#include <iostream>
#include <stack>
using namespace std;

struct Cell
{
    int row;
    int col;
};

bool isValid(int** maze, bool** visited,
             int rows, int cols, int r, int c)
{
    return (r >= 0 && r < rows &&
            c >= 0 && c < cols &&
            maze[r][c] == 1 &&
            !visited[r][c]);
}

void solveMaze(int** maze, int rows, int cols,
               int sr, int sc, int dr, int dc)
{
    stack<Cell> s;

    bool** visited = new bool*[rows];
    for (int i = 0; i < rows; i++)
    {
        visited[i] = new bool[cols];
        for (int j = 0; j < cols; j++)
        {
            visited[i][j] = false;
        }
    }

    s.push({sr, sc});
    visited[sr][sc] = true;

    while (!s.empty())
    {
        Cell current = s.top();

        if (current.row == dr && current.col == dc)
        {
            cout << "\nPath Found!\n";
            cout << "Path: ";

            stack<Cell> path;
            while (!s.empty())
            {
                path.push(s.top());
                s.pop();
            }

            while (!path.empty())
            {
                cout << "(" << path.top().row
                     << "," << path.top().col << ")";
                path.pop();
                if (!path.empty())
                    cout << " -> ";
            }
            cout << endl;

            for (int i = 0; i < rows; i++)
                delete[] visited[i];
            delete[] visited;

            return;
        }

        int r = current.row;
        int c = current.col;
        bool moved = false;

        // Direction priority:
        // 1. Down  (r + 1, c)
        // 2. Right (r, c + 1)
        // 3. Up    (r - 1, c)
        // 4. Left  (r, c - 1)

        if (isValid(maze, visited, rows, cols, r + 1, c))
        {
            s.push({r + 1, c});
            visited[r + 1][c] = true;
            moved = true;
        }
        else if (isValid(maze, visited, rows, cols, r, c + 1))
        {
            s.push({r, c + 1});
            visited[r][c + 1] = true;
            moved = true;
        }
        else if (isValid(maze, visited, rows, cols, r - 1, c))
        {
            s.push({r - 1, c});
            visited[r - 1][c] = true;
            moved = true;
        }
        else if (isValid(maze, visited, rows, cols, r, c - 1))
        {
            s.push({r, c - 1});
            visited[r][c - 1] = true;
            moved = true;
        }

        if (!moved)
        {
            s.pop();
        }
    }

    cout << "\nNo path exists!\n";

    for (int i = 0; i < rows; i++)
        delete[] visited[i];
    delete[] visited;
}

int main()
{
    int rows, cols;
    cout << "Enter number of rows: ";
    cin >> rows;
    cout << "Enter number of columns: ";
    cin >> cols;

    int** maze = new int*[rows];
    for (int i = 0; i < rows; i++)
    {
        maze[i] = new int[cols];
    }

    cout << "\nEnter the maze (1 = Path, 0 = Blocked):\n";
    for (int i = 0; i < rows; i++)
    {
        for (int j = 0; j < cols; j++)
        {
            cin >> maze[i][j];
        }
    }

    int sr, sc, dr, dc;
    cout << "\nEnter starting row and column: ";
    cin >> sr >> sc;
    cout << "Enter destination row and column: ";
    cin >> dr >> dc;

    if (sr < 0 || sr >= rows ||
        sc < 0 || sc >= cols ||
        dr < 0 || dr >= rows ||
        dc < 0 || dc >= cols)
    {
        cout << "\nInvalid starting or destination position!\n";
    }
    else if (maze[sr][sc] == 0 || maze[dr][dc] == 0)
    {
        cout << "\nStart and destination must be open cells!\n";
    }
    else
    {
        solveMaze(maze, rows, cols, sr, sc, dr, dc);
    }

    for (int i = 0; i < rows; i++)
        delete[] maze[i];
    delete[] maze;

    return 0;
}
