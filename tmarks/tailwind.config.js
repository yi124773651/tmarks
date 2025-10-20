/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 基础颜色
        background: 'var(--background)',
        foreground: 'var(--foreground)',

        // 卡片
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',

        // 弹出层
        popover: 'var(--popover)',
        'popover-foreground': 'var(--popover-foreground)',

        // 主色调
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',

        // 次要色
        secondary: 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',

        // 静音色
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',

        // 强调色
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',

        // 成功色
        success: 'var(--success)',
        'success-foreground': 'var(--success-foreground)',

        // 错误/危险色
        destructive: 'var(--destructive)',
        'destructive-foreground': 'var(--destructive-foreground)',
        error: 'var(--destructive)',
        'error-content': 'var(--destructive-foreground)',

        // 警告色
        warning: 'var(--warning)',
        'warning-foreground': 'var(--warning-foreground)',
        'warning-content': 'var(--warning-foreground)',

        // 边框和输入框
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        lg: `calc(var(--radius) + 4px)`,
        md: `calc(var(--radius) + 2px)`,
        sm: 'calc(var(--radius) - 2px)',
      },
    },
  },
  plugins: [],
}
