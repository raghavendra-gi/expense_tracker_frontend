import { useNavigate } from 'react-router-dom';
import { EXPENSE_TYPES } from '../constants/expenseTypes';
import Layout from '../components/Layout';

export default function SelectExpenseTypePage() {
  const navigate = useNavigate();

  const handleSelect = (type) => {
    navigate('/form', { state: { expenseType: type } });
  };

  return (
    // 👇 ADDED title 👇
    <Layout title="Submit Expense">
      <div className="card">
        <div className="card-title">Pick a category</div>
        <div className="type-grid">
          {Object.keys(EXPENSE_TYPES).map(type => (
            <button 
              key={type} 
              className="type-btn" 
              onClick={() => handleSelect(type)}
            >
              <span className="emoji">{EXPENSE_TYPES[type].icon}</span>
              <span>{type}</span>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
}