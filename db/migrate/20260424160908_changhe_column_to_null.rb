class ChangheColumnToNull < ActiveRecord::Migration[8.1]
  def change
    change_column_null :users, :vet_id, true
  end
end
