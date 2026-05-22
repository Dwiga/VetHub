class DeleteTableWeight < ActiveRecord::Migration[8.1]
  def change
    drop_table :weights
  end
end
